import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

export async function GET() {
  await connection();
  try {
    await ensureDatabaseTables();
    const res = await query('SELECT * FROM projects ORDER BY created_at DESC');
    const projects = res.rows.map((p: any) => ({
      ...p,
      budget: Number(p.budget) || 0,
      spent_amount: Number(p.spent_amount) || 0,
      progress_percent: Number(p.progress_percent) || 0,
      services: Array.isArray(p.services) ? p.services : [],
      team_member_ids: Array.isArray(p.team_member_ids) ? p.team_member_ids : [],
    }));
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('[GET /api/projects failed]', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    await ensureDatabaseTables();
    const body = await request.json();

    const id = body.id || `proj_${randomBytes(6).toString('hex')}`;
    const name = body.name || 'Untitled Creative Project';
    const client_id = body.client_id;
    const client_name = body.client_name || 'Client';
    const proposal_id = body.proposal_id || null;
    const project_owner_id = body.project_owner_id || null;
    const project_owner_name = body.project_owner_name || null;
    const account_manager_id = body.account_manager_id || null;
    const account_manager_name = body.account_manager_name || null;
    const team_member_ids = Array.isArray(body.team_member_ids) ? body.team_member_ids : [];
    const status = body.status || 'planning';
    const progress_percent = Number(body.progress_percent) || 0;
    const budget = Number(body.budget) || 0;
    const spent_amount = Number(body.spent_amount) || 0;
    const services = Array.isArray(body.services) ? body.services : [];
    const contracted_scope = body.contracted_scope || '';
    const start_date = body.start_date || new Date().toISOString().split('T')[0];
    const deadline = body.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const res = await query(
      `INSERT INTO projects (
        id, name, client_id, client_name, proposal_id, project_owner_id, project_owner_name,
        account_manager_id, account_manager_name, team_member_ids, status, progress_percent,
        budget, spent_amount, services, contracted_scope, start_date, deadline, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, now(), now()
      ) RETURNING *;`,
      [
        id, name, client_id, client_name, proposal_id, project_owner_id, project_owner_name,
        account_manager_id, account_manager_name, team_member_ids, status, progress_percent,
        budget, spent_amount, services, contracted_scope, start_date, deadline
      ]
    );

    const project = {
      ...res.rows[0],
      budget: Number(res.rows[0].budget) || 0,
      spent_amount: Number(res.rows[0].spent_amount) || 0,
      progress_percent: Number(res.rows[0].progress_percent) || 0,
      services: Array.isArray(res.rows[0].services) ? res.rows[0].services : [],
      team_member_ids: Array.isArray(res.rows[0].team_member_ids) ? res.rows[0].team_member_ids : [],
    };

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/projects failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    );
  }
}
