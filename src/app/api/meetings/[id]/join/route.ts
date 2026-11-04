import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureMeetingsDatabaseTables } from '@/lib/db/init';

/**
 * POST /api/meetings/[id]/join
 *
 * Server-side authorization gate before entering Jitsi room.
 * Ensures only authorized employees or administrators can join.
 * Automatically marks participant status as 'joined' and meeting as 'live'.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureMeetingsDatabaseTables();

    const body = await request.json();
    const { employee_id, employee_name } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id required' }, { status: 400 });
    }

    // 1. Fetch meeting
    const mtgResult = await query<{
      id: string; room_id: string; status: string; organizer_id: string; organizer_name: string;
    }>(`SELECT id, room_id, status, organizer_id, organizer_name FROM meetings WHERE id = $1`, [id]);

    if (mtgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = mtgResult.rows[0];

    if (meeting.status === 'cancelled') {
      return NextResponse.json({ error: 'Meeting has been cancelled' }, { status: 403 });
    }
    if (meeting.status === 'ended') {
      return NextResponse.json({ error: 'Meeting has already ended' }, { status: 403 });
    }

    // 2. Check authorization
    const isOrganizer = meeting.organizer_id === employee_id;

    const pResult = await query<{ id: string; invitation_status: string }>(
      `SELECT id, invitation_status FROM meeting_participants
       WHERE meeting_id = $1 AND (employee_id = $2 OR employee_name = $3)`,
      [id, employee_id, employee_name || employee_id]
    );
    const isParticipant = pResult.rows.length > 0;

    // Check if employee is an admin
    const profileRes = await query<{ role: string }>(
      `SELECT role FROM profiles WHERE id = $1`,
      [employee_id]
    );
    const isAdmin = profileRes.rows[0]?.role === 'admin' || employee_id === 'user_admin';

    if (!isOrganizer && !isParticipant && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied: You are not invited to this company meeting.' },
        { status: 403 }
      );
    }

    // 3. If Admin was not originally in participants, add them as accepted
    if (isAdmin && !isParticipant && !isOrganizer) {
      await query(
        `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status, joined_at)
         VALUES ($1, $2, $3, 'joined', now())
         ON CONFLICT (meeting_id, employee_id) DO UPDATE SET invitation_status = 'joined', joined_at = now()`,
        [id, employee_id, employee_name || 'Admin']
      );
    } else {
      // Record join event for participant
      await query(
        `UPDATE meeting_participants
         SET invitation_status = 'joined', joined_at = now()
         WHERE meeting_id = $1 AND (employee_id = $2 OR employee_name = $3)`,
        [id, employee_id, employee_name || employee_id]
      );
    }

    // 4. Mark meeting status as 'live' if it was scheduled
    if (meeting.status === 'scheduled') {
      await query(
        `UPDATE meetings SET status = 'live', updated_at = now() WHERE id = $1`,
        [id]
      );
    }

    return NextResponse.json({
      room_id: meeting.room_id,
      jitsi_domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si',
    });
  } catch (err) {
    console.error('[meetings/join:POST]', err);
    return NextResponse.json(
      { error: 'Database error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
