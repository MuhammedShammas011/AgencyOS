import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  await connection();
  const { itemId } = await params;

  try {
    await ensureDatabaseTables();
    const updates = await request.json();

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed = ['title', 'service', 'status', 'progress', 'notes'];
    for (const f of allowed) {
      if (updates[f] !== undefined) {
        setClauses.push(`${f} = $${idx}`);
        values.push(updates[f]);
        idx++;
      }
    }

    setClauses.push('updated_at = now()');
    values.push(itemId);

    const res = await query(
      `UPDATE client_work_items SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *;`,
      values
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const workItem = {
      ...res.rows[0],
      progress: Number(res.rows[0].progress) || 0,
    };

    return NextResponse.json({ workItem });
  } catch (error) {
    console.error('[PATCH work-item failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update work item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  await connection();
  const { itemId } = await params;

  try {
    await ensureDatabaseTables();
    await query('DELETE FROM client_work_items WHERE id = $1', [itemId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE work-item failed]', error);
    return NextResponse.json({ error: 'Failed to delete work item' }, { status: 500 });
  }
}
