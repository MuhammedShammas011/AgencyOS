import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id: clientId } = await params;

  try {
    await ensureDatabaseTables();
    const res = await query(
      'SELECT * FROM client_work_items WHERE client_id = $1 ORDER BY created_at DESC',
      [clientId]
    );

    const workItems = res.rows.map((w: any) => ({
      ...w,
      progress: Number(w.progress) || 0,
    }));

    return NextResponse.json({ workItems });
  } catch (error) {
    console.error('[GET /api/clients/[id]/work-items failed]', error);
    return NextResponse.json({ error: 'Failed to fetch work items' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id: clientId } = await params;

  try {
    await ensureDatabaseTables();
    const body = await request.json();

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = body.id || `work_${randomBytes(6).toString('hex')}`;
    const service = body.service || 'Brand Identity & Strategy';
    const status = body.status || 'not_started';
    const progress = Math.min(100, Math.max(0, Number(body.progress) || 0));
    const notes = body.notes || null;

    const res = await query(
      `INSERT INTO client_work_items (id, client_id, title, service, status, progress, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING *;`,
      [id, clientId, title, service, status, progress, notes]
    );

    const workItem = {
      ...res.rows[0],
      progress: Number(res.rows[0].progress) || 0,
    };

    return NextResponse.json({ workItem }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/clients/[id]/work-items failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create work item' },
      { status: 500 }
    );
  }
}
