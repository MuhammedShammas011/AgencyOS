import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

export async function GET() {
  await connection();
  try {
    await ensureDatabaseTables();
    const res = await query('SELECT * FROM clients ORDER BY created_at DESC');
    const clients = res.rows.map((c: any) => ({
      ...c,
      monthly_retainer: Number(c.monthly_retainer) || 0,
      project_value: Number(c.project_value) || 0,
      agreed_amount: Number(c.agreed_amount) || 0,
      total_invoiced: Number(c.total_invoiced) || 0,
      total_paid: Number(c.total_paid) || 0,
      outstanding_balance: Number(c.outstanding_balance) || 0,
      lifetime_value: Number(c.lifetime_value) || 0,
      services: Array.isArray(c.services) ? c.services : [],
    }));
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('[GET /api/clients failed]', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  await connection();
  try {
    await ensureDatabaseTables();
    const body = await request.json();

    const id = body.id || `client_${randomBytes(6).toString('hex')}`;
    const name = body.name || body.company || 'Untitled Client';
    const company = body.company || body.name || 'Untitled Co';
    const industry = body.industry || 'General';
    const status = body.status || 'active';
    const health_score = body.health_score ?? 90;
    const email = body.email || null;
    const phone = body.phone || null;
    const account_manager_id = body.account_manager_id || null;
    const account_manager_name = body.account_manager_name || null;
    const sales_owner_id = body.sales_owner_id || null;
    const sales_owner_name = body.sales_owner_name || null;
    const services = Array.isArray(body.services) ? body.services : [];
    const agreed_amount = Number(body.agreed_amount ?? body.project_value ?? 0);
    const monthly_retainer = Number(body.monthly_retainer || 0);
    const project_value = Number(body.project_value || agreed_amount);
    const payment_due_date = body.payment_due_date || null;
    const contract_start_date = body.contract_start_date || new Date().toISOString().split('T')[0];
    const contract_end_date = body.contract_end_date || null;
    const website = body.website || null;
    const address = body.address || null;
    const internal_notes = body.internal_notes || null;

    const res = await query(
      `INSERT INTO clients (
        id, name, company, industry, status, health_score, email, phone,
        account_manager_id, account_manager_name, sales_owner_id, sales_owner_name,
        services, agreed_amount, monthly_retainer, project_value,
        total_invoiced, total_paid, outstanding_balance, lifetime_value,
        payment_due_date, contract_start_date, contract_end_date,
        website, address, internal_notes, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16,
        0, 0, $14, $14,
        $17, $18, $19,
        $20, $21, $22, now(), now()
      ) RETURNING *;`,
      [
        id, name, company, industry, status, health_score, email, phone,
        account_manager_id, account_manager_name, sales_owner_id, sales_owner_name,
        services, agreed_amount, monthly_retainer, project_value,
        payment_due_date, contract_start_date, contract_end_date,
        website, address, internal_notes,
      ]
    );

    const raw = res.rows[0] as any;
    const client = {
      ...raw,
      monthly_retainer: Number(raw.monthly_retainer) || 0,
      project_value: Number(raw.project_value) || 0,
      agreed_amount: Number(raw.agreed_amount) || 0,
      total_invoiced: Number(raw.total_invoiced) || 0,
      total_paid: Number(raw.total_paid) || 0,
      outstanding_balance: Number(raw.outstanding_balance) || 0,
      lifetime_value: Number(raw.lifetime_value) || 0,
      services: Array.isArray(raw.services) ? raw.services : [],
    };

    // Log activity
    await query(
      `INSERT INTO activity_logs (id, actor_name, actor_role, action_type, entity_type, entity_id, entity_name, description)
       VALUES ($1, $2, $3, 'client_created', 'client', $4, $5, $6);`,
      [
        `act_${randomBytes(6).toString('hex')}`,
        account_manager_name || 'System',
        'account_manager',
        client.id,
        client.company,
        `Created client "${client.company}" with agreed amount ₹${client.agreed_amount}`,
      ]
    ).catch(() => {});

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/clients failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create client' },
      { status: 500 }
    );
  }
}
