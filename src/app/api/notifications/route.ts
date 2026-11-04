import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureMeetingsDatabaseTables } from '@/lib/db/init';

// ── GET /api/notifications ───────────────────────────────────────────────────
// Returns notifications for an employee from PostgreSQL.
export async function GET(request: NextRequest) {
  await connection();
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employee_id');

  if (!employeeId) {
    return NextResponse.json({ notifications: [] });
  }

  try {
    await ensureMeetingsDatabaseTables();

    const result = await query(
      `SELECT * FROM notifications
       WHERE recipient_profile_id = $1
       ORDER BY created_at DESC
       LIMIT 40`,
      [employeeId]
    );

    return NextResponse.json({ notifications: result.rows }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (err) {
    console.error('[notifications:GET]', err);
    return NextResponse.json({ notifications: [] });
  }
}

// ── PATCH /api/notifications ──────────────────────────────────────────────────
// Mark a notification (or all) as read.
export async function PATCH(request: NextRequest) {
  try {
    await ensureMeetingsDatabaseTables();

    const body = await request.json();
    const { id, all, employee_id } = body;

    if (all && employee_id) {
      await query(
        `UPDATE notifications SET is_read = true WHERE recipient_profile_id = $1`,
        [employee_id]
      );
    } else if (id) {
      await query(
        `UPDATE notifications SET is_read = true WHERE id = $1`,
        [id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[notifications:PATCH]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
