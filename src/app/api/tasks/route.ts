import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

export async function GET() {
  await connection();
  try {
    await ensureDatabaseTables();
    const res = await query('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC');
    const tasks = res.rows.map((t: any) => ({
      ...t,
      estimated_hours: Number(t.estimated_hours) || 0,
      actual_hours: Number(t.actual_hours) || 0,
    }));
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('[GET /api/tasks failed]', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    await ensureDatabaseTables();
    const body = await request.json();

    const id = body.id || `task_${randomBytes(6).toString('hex')}`;
    const project_id = body.project_id;
    const project_name = body.project_name || null;
    const client_id = body.client_id || null;
    const client_name = body.client_name || null;
    const deliverable_id = body.deliverable_id || null;
    const title = body.title?.trim();
    if (!title || !project_id) {
      return NextResponse.json({ error: 'Title and project_id are required' }, { status: 400 });
    }

    const description = body.description || null;
    const assigned_to_id = body.assigned_to_id || null;
    const assigned_to_name = body.assigned_to_name || null;
    const priority = body.priority || 'medium';
    const status = body.status || 'todo';
    const estimated_hours = Number(body.estimated_hours) || 0;
    const actual_hours = Number(body.actual_hours) || 0;
    const start_date = body.start_date || null;
    const due_date = body.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const res = await query(
      `INSERT INTO tasks (
        id, project_id, project_name, client_id, client_name, deliverable_id,
        title, description, assigned_to_id, assigned_to_name, priority, status,
        estimated_hours, actual_hours, start_date, due_date, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, now(), now()
      ) RETURNING *;`,
      [
        id, project_id, project_name, client_id, client_name, deliverable_id,
        title, description, assigned_to_id, assigned_to_name, priority, status,
        estimated_hours, actual_hours, start_date, due_date
      ]
    );

    const task = {
      ...res.rows[0],
      estimated_hours: Number(res.rows[0].estimated_hours) || 0,
      actual_hours: Number(res.rows[0].actual_hours) || 0,
    };

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/tasks failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
