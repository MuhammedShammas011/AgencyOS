import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;

  try {
    await ensureDatabaseTables();
    const updates = await request.json();

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['title', 'description', 'assigned_to_id', 'assigned_to_name', 'priority', 'status', 'estimated_hours', 'actual_hours', 'start_date', 'due_date', 'completed_at'];
    for (const f of allowed) {
      if (updates[f] !== undefined) {
        setClauses.push(`${f} = $${idx}`);
        values.push(updates[f]);
        idx++;
      }
    }

    setClauses.push('updated_at = now()');
    values.push(id);

    const res = await query(
      `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`,
      values
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = {
      ...res.rows[0],
      estimated_hours: Number(res.rows[0].estimated_hours) || 0,
      actual_hours: Number(res.rows[0].actual_hours) || 0,
    };

    return NextResponse.json({ task });
  } catch (error) {
    console.error('[PATCH /api/tasks/[id] failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}
