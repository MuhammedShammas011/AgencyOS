import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
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
    // Fetch meetings the employee organised or was invited to
    const result = await query<{
      id: string; title: string; description: string; room_id: string;
      organizer_id: string; organizer_name: string; scheduled_at: string;
      duration_minutes: number; status: string; ended_at: string;
      created_at: string; updated_at: string;
    }>(
      `SELECT DISTINCT m.*
       FROM meetings m
       LEFT JOIN meeting_participants mp ON mp.meeting_id = m.id
       WHERE m.organizer_id = $1 OR mp.employee_id = $1
       ORDER BY m.scheduled_at DESC NULLS FIRST, m.created_at DESC
       LIMIT 100`,
      [employeeId]
    );

    // For each meeting, fetch participants
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

    return NextResponse.json({ meetings });
  } catch (err) {
    console.error('[meetings:GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── POST /api/meetings ────────────────────────────────────────────────────────
// Creates a new meeting (instant or scheduled).
export async function POST(request: NextRequest) {
  try {
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

    if (!title || !organizer_id || !organizer_name) {
      return NextResponse.json({ error: 'title, organizer_id and organizer_name are required' }, { status: 400 });
    }

    const room_id = generateRoomId();
    const status = scheduled_at ? 'scheduled' : 'live';

    // Insert meeting
    const mtgResult = await query<{ id: string }>(
      `INSERT INTO meetings (title, description, room_id, organizer_id, organizer_name, scheduled_at, duration_minutes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [title, description || null, room_id, organizer_id, organizer_name,
       scheduled_at || null, duration_minutes, status]
    );

    const meetingId = mtgResult.rows[0].id;

    // Insert participants (skip if same as organizer — organizer joins automatically)
    for (let i = 0; i < participant_ids.length; i++) {
      const eid = participant_ids[i];
      if (!eid || eid === organizer_id) continue;
      await query(
        `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status)
         VALUES ($1, $2, $3, 'invited')
         ON CONFLICT (meeting_id, employee_id) DO NOTHING`,
        [meetingId, eid, participant_names[i] || eid]
      );
    }

    // Insert organizer as participant with accepted status
    await query(
      `INSERT INTO meeting_participants (meeting_id, employee_id, employee_name, invitation_status)
       VALUES ($1, $2, $3, 'accepted')
       ON CONFLICT (meeting_id, employee_id) DO NOTHING`,
      [meetingId, organizer_id, organizer_name]
    );

    // Fetch the full record to return
    const full = await query(
      `SELECT * FROM meetings WHERE id = $1`, [meetingId]
    );
    const parts = await query(
      `SELECT * FROM meeting_participants WHERE meeting_id = $1`, [meetingId]
    );

    return NextResponse.json({
      meeting: { ...full.rows[0], participants: parts.rows }
    }, { status: 201 });
  } catch (err) {
    console.error('[meetings:POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
