import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureMeetingsDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

/** Generate a cryptographically random room ID. */
function generateRoomId(): string {
  const random = randomBytes(4).toString('hex');
  return `cubstudio-meeting-${random}`;
}

// ── GET /api/meetings ─────────────────────────────────────────────────────────
// Returns meetings where employee_id is organizer or participant.
// Query param: ?employee_id=...
export async function GET(request: NextRequest) {
  await connection();
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id');

  if (!employeeId) {
    return NextResponse.json({ error: 'employee_id required' }, { status: 400 });
  }

  try {
    await ensureMeetingsDatabaseTables();

    // Fetch meetings the employee organized, was invited to, or joined
    const result = await query<{
      id: string; title: string; description: string; room_id: string;
      organizer_id: string; organizer_name: string; scheduled_at: string;
      duration_minutes: number; status: string; ended_at: string;
      created_at: string; updated_at: string;
    }>(
      `SELECT DISTINCT m.*
       FROM meetings m
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
       WHERE m.organizer_id = $1 OR mp.employee_id = $1 OR mp.employee_name = $1
       ORDER BY
         CASE WHEN m.status = 'live' THEN 0 WHEN m.status = 'scheduled' THEN 1 ELSE 2 END,
         m.scheduled_at DESC NULLS FIRST,
         m.created_at DESC
       LIMIT 100`,
      [employeeId]
    );

    // Fetch participants for each meeting
    const meetings = await Promise.all(
      result.rows.map(async (m) => {
        const pResult = await query<{
          id: string; meeting_id: string; employee_id: string; employee_name: string;
          invitation_status: string; joined_at: string; left_at: string; created_at: string;
        }>(
          `SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY created_at`,
          [m.id]
        );
        return { ...m, participants: pResult.rows };
      })
    );

    return NextResponse.json({ meetings }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    console.error('[meetings:GET]', err);
    return NextResponse.json(
      { error: 'Database error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── POST /api/meetings ────────────────────────────────────────────────────────
// Creates a new meeting (instant or scheduled).
export async function POST(request: NextRequest) {
  try {
    await ensureMeetingsDatabaseTables();

    const body = await request.json();
    const {
      title,
      description,
      organizer_id,
      organizer_name,
      scheduled_at,       // ISO string or null/undefined for instant
      duration_minutes = 60,
      participant_ids = [],  // array of employee IDs to invite
      participant_names = [], // parallel array of employee names
    } = body;

    if (!title?.trim() || !organizer_id || !organizer_name) {
      return NextResponse.json(
        { error: 'title, organizer_id and organizer_name are required' },
        { status: 400 }
      );
    }

    const room_id = generateRoomId();
    // Instant meetings start as 'live'; scheduled meetings start as 'scheduled'
    const status = scheduled_at ? 'scheduled' : 'live';

    // 1. Insert meeting into PostgreSQL
    const mtgResult = await query<{ id: string }>(
      `INSERT INTO meetings (title, description, room_id, organizer_id, organizer_name, scheduled_at, duration_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        title.trim(),
        description?.trim() || null,
        room_id,
        organizer_id,
        organizer_name,
        scheduled_at || null,
        duration_minutes,
        status,
      ]
    );

    const meetingId = mtgResult.rows[0].id;

    // 2. Insert organizer as participant (accepted status)
    await query(
      `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status)
       VALUES ($1, $2, $3, 'accepted')
       ON CONFLICT (meeting_id, employee_id) DO NOTHING`,
      [meetingId, organizer_id, organizer_name]
    );

    // 3. Insert invited participants and generate notifications in PostgreSQL
    for (let i = 0; i < participant_ids.length; i++) {
      const eid = participant_ids[i];
      if (!eid || eid === organizer_id) continue;
      const ename = participant_names[i] || eid;

      await query(
        `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status)
         VALUES ($1, $2, $3, 'invited')
         ON CONFLICT (meeting_id, employee_id) DO NOTHING`,
        [meetingId, eid, ename]
      );

      // Create persistent notification for invited employee
      const notifTitle = status === 'live' ? `Live Meeting: ${title}` : `Meeting Invitation: ${title}`;
      const notifMsg = status === 'live'
        ? `${organizer_name} started an instant meeting "${title}". Join now.`
        : `${organizer_name} invited you to "${title}" scheduled for ${scheduled_at}.`;

      try {
        await query(
          `INSERT INTO notifications (recipient_profile_id, title, message, type, urgency, link_url)
           VALUES ($1, $2, $3, 'meeting_invitation', 'high', $4)`,
          [eid, notifTitle, notifMsg, `/meetings/${meetingId}`]
        );
      } catch (notifErr) {
        console.warn('[notifications:insert_failed]', notifErr);
      }
    }

    // 4. Fetch the full created record with participants
    const full = await query(`SELECT * FROM meetings WHERE id = $1`, [meetingId]);
    const parts = await query(
      `SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY created_at`,
      [meetingId]
    );

    return NextResponse.json({
      meeting: { ...full.rows[0], participants: parts.rows },
    }, { status: 201 });
  } catch (err) {
    console.error('[meetings:POST]', err);
    return NextResponse.json(
      { error: 'Failed to create meeting in database', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
