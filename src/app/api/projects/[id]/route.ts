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

    const allowed = ['name', 'status', 'progress_percent', 'budget', 'spent_amount', 'services', 'contracted_scope', 'start_date', 'deadline', 'completed_at'];
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
      `UPDATE projects SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`,
      values
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = {
      ...res.rows[0],
      budget: Number(res.rows[0].budget) || 0,
      spent_amount: Number(res.rows[0].spent_amount) || 0,
      progress_percent: Number(res.rows[0].progress_percent) || 0,
      services: Array.isArray(res.rows[0].services) ? res.rows[0].services : [],
      team_member_ids: Array.isArray(res.rows[0].team_member_ids) ? res.rows[0].team_member_ids : [],
    };

    return NextResponse.json({ project });
  } catch (error) {
    console.error('[PATCH /api/projects/[id] failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    );
  }
}
