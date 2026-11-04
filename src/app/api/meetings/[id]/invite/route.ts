import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ensureMeetingsDatabaseTables } from '@/lib/db/init';

/**
 * POST /api/meetings/[id]/invite
 *
 * Allows inviting additional employees to an existing meeting.
 * Inserts them into meeting_participants and sends in-app notifications.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await ensureMeetingsDatabaseTables();

    const body = await request.json();
    const { employee_ids = [], employee_names = [] } = body;

    const mtgResult = await query<{
      id: string; title: string; organizer_name: string; status: string;
    }>(`SELECT id, title, organizer_name, status FROM meetings WHERE id = $1`, [id]);

    if (mtgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meeting = mtgResult.rows[0];

    for (let i = 0; i < employee_ids.length; i++) {
      const eid = employee_ids[i];
      if (!eid) continue;
      const ename = employee_names[i] || eid;

      await query(
        `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status)
         VALUES ($1, $2, $3, 'invited')
         ON CONFLICT (meeting_id, employee_id) DO NOTHING`,
        [id, eid, ename]
      );

      const notifTitle = meeting.status === 'live' ? `Live Meeting: ${meeting.title}` : `Meeting Invitation: ${meeting.title}`;
      const notifMsg = `${meeting.organizer_name} invited you to "${meeting.title}". Click to join.`;

      try {
        await query(
          `INSERT INTO notifications (recipient_profile_id, title, message, type, urgency, link_url)
           VALUES ($1, $2, $3, 'meeting_invitation', 'high', $4)`,
          [eid, notifTitle, notifMsg, `/meetings/${id}`]
        );
      } catch (err) {
        console.warn('[notifications:invite_failed]', err);
      }
    }

    const pResult = await query(
      `SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY created_at`,
      [id]
    );

    return NextResponse.json({ participants: pResult.rows });
  } catch (err) {
    console.error('[meetings/invite:POST]', err);
    return NextResponse.json(
      { error: 'Failed to invite participants', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
