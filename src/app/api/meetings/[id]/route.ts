import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ── GET /api/meetings/[id] ────────────────────────────────────────────────────
// Fetch a single meeting with participants. Used by the room page.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const mtgResult = await query(`SELECT * FROM meetings WHERE id = $1`, [id]);
    if (mtgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    const pResult = await query(
      `SELECT * FROM meeting_participants WHERE meeting_id = $1 ORDER BY created_at`,
      [id]
    );
    return NextResponse.json({ meeting: { ...mtgResult.rows[0], participants: pResult.rows } });
  } catch (err) {
    console.error('[meetings/[id]:GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── PATCH /api/meetings/[id] ──────────────────────────────────────────────────
// Update meeting status or end it.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, ended_at } = body;

    const allowed = ['scheduled', 'live', 'ended', 'cancelled'];
    if (status && !allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await query(
      `UPDATE meetings SET status = COALESCE($1, status), ended_at = COALESCE($2, ended_at), updated_at = now() WHERE id = $3`,
      [status || null, ended_at || null, id]
    );

    const result = await query(`SELECT * FROM meetings WHERE id = $1`, [id]);
    const pResult = await query(`SELECT * FROM meeting_participants WHERE meeting_id = $1`, [id]);
    return NextResponse.json({ meeting: { ...result.rows[0], participants: pResult.rows } });
  } catch (err) {
    console.error('[meetings/[id]:PATCH]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// ── DELETE /api/meetings/[id] ─────────────────────────────────────────────────
// Cancel a meeting.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await query(`UPDATE meetings SET status = 'cancelled', updated_at = now() WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[meetings/[id]:DELETE]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
