import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import { randomBytes } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;

  try {
    await ensureDatabaseTables();
    const res = await query('SELECT * FROM clients WHERE id = $1', [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const c = res.rows[0] as any;
    const client = {
      ...c,
      monthly_retainer: Number(c.monthly_retainer) || 0,
      project_value: Number(c.project_value) || 0,
      agreed_amount: Number(c.agreed_amount) || 0,
      total_invoiced: Number(c.total_invoiced) || 0,
      total_paid: Number(c.total_paid) || 0,
      outstanding_balance: Number(c.outstanding_balance) || 0,
      lifetime_value: Number(c.lifetime_value) || 0,
      services: Array.isArray(c.services) ? c.services : [],
    };

    return NextResponse.json({ client });
  } catch (error) {
    console.error('[GET /api/clients/[id] failed]', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;

  try {
    await ensureDatabaseTables();
    const updates = await request.json();

    // Build dynamic UPDATE query
    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = [
      'name', 'company', 'industry', 'status', 'health_score',
      'email', 'phone', 'account_manager_id', 'account_manager_name',
      'sales_owner_id', 'sales_owner_name', 'services', 'agreed_amount',
      'monthly_retainer', 'project_value', 'total_invoiced', 'total_paid',
      'outstanding_balance', 'lifetime_value', 'payment_due_date',
      'last_payment_date', 'contract_start_date', 'contract_end_date',
      'next_action', 'next_action_due', 'website', 'address', 'internal_notes',
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${idx}`);
        values.push(updates[field]);
        idx++;
      }
    }

    setClauses.push(`updated_at = now()`);
    values.push(id);

    const updateSql = `
      UPDATE clients
      SET ${setClauses.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query(updateSql, values);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const c = res.rows[0] as any;
    const client = {
      ...c,
      monthly_retainer: Number(c.monthly_retainer) || 0,
      project_value: Number(c.project_value) || 0,
      agreed_amount: Number(c.agreed_amount) || 0,
      total_invoiced: Number(c.total_invoiced) || 0,
      total_paid: Number(c.total_paid) || 0,
      outstanding_balance: Number(c.outstanding_balance) || 0,
      lifetime_value: Number(c.lifetime_value) || 0,
      services: Array.isArray(c.services) ? c.services : [],
    };

    // If account manager was reassigned, log activity
    if (updates.account_manager_id) {
      await query(
        `INSERT INTO activity_logs (id, actor_name, actor_role, action_type, entity_type, entity_id, entity_name, description)
         VALUES ($1, $2, $3, 'client_owner_reassigned', 'client', $4, $5, $6);`,
        [
          `act_${randomBytes(6).toString('hex')}`,
          updates.account_manager_name || 'Admin',
          'admin',
          client.id,
          client.company,
          `Reassigned client "${client.company}" to ${updates.account_manager_name || updates.account_manager_id}`,
        ]
      ).catch(() => {});
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('[PATCH /api/clients/[id] failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update client' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connection();
  const { id } = await params;

  try {
    await ensureDatabaseTables();
    // Soft-delete: mark client as 'lost'
    await query("UPDATE clients SET status = 'lost', updated_at = now() WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/clients/[id] failed]', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
