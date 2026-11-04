import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/meetings/[id]/join
 *
 * Server-side access control gate before an employee enters the Jitsi room.
 * Returns the room_id ONLY if the requesting employee is a valid participant.
 *
 * Security note: This does not make the public meet.jit.si room truly private
 * (anyone with the room_id can still join via the public service). When you
 * migrate to a self-hosted Jitsi with JWT, replace this with JWT token
 * generation instead of returning the raw room_id.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { employee_id, employee_name } = body;

    if (!employee_id) {
      return NextResponse.json({ error: 'employee_id required' }, { status: 400 });
    }

    // 1. Fetch the meeting
    const mtgResult = await query<{
      id: string; room_id: string; status: string; organizer_id: string;
    }>(`SELECT id, room_id, status, organizer_id FROM meetings WHERE id = $1`, [id]);

    if (mtgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = mtgResult.rows[0];

    if (meeting.status === 'cancelled') {
      return NextResponse.json({ error: 'Meeting has been cancelled' }, { status: 403 });
    }
    if (meeting.status === 'ended') {
      return NextResponse.json({ error: 'Meeting has ended' }, { status: 403 });
    }

    // 2. Check participant membership
    const isOrganizer = meeting.organizer_id === employee_id;
    const pResult = await query<{ id: string; invitation_status: string }>(
      `SELECT id, invitation_status FROM meeting_participants WHERE meeting_id = $1 AND employee_id = $2`,
      [id, employee_id]
    );
    const isParticipant = pResult.rows.length > 0;

    if (!isOrganizer && !isParticipant) {
      return NextResponse.json({ error: 'Access denied: not a meeting participant' }, { status: 403 });
    }

    // 3. Record join event
    if (isParticipant) {
      await query(
        `UPDATE meeting_participants
         SET invitation_status = 'joined', joined_at = now()
         WHERE meeting_id = $1 AND employee_id = $2`,
        [id, employee_id]
      );
    }

    // 4. Mark meeting as live if it isn't already
    if (meeting.status === 'scheduled') {
      await query(`UPDATE meetings SET status = 'live', updated_at = now() WHERE id = $1`, [id]);
    }

    // 5. Return the room_id so the frontend can open Jitsi.
    //    TODO: when migrating to self-hosted Jitsi with JWT, generate a signed
    //    token here instead of returning the raw room_id.
    return NextResponse.json({
      room_id: meeting.room_id,
      jitsi_domain: process.env.JITSI_DOMAIN || 'meet.jit.si',
    });
  } catch (err) {
    console.error('[meetings/join:POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
