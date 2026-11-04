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
      'SELECT * FROM client_payments WHERE client_id = $1 ORDER BY payment_date DESC, created_at DESC',
      [clientId]
    );

    const payments = res.rows.map((p: any) => ({
      ...p,
      amount: Number(p.amount) || 0,
    }));

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('[GET /api/clients/[id]/payments failed]', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
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

    const amount = Number(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount required' }, { status: 400 });
    }

    const paymentDate = body.payment_date || new Date().toISOString().split('T')[0];
    const note = body.note || null;
    const paymentId = body.id || `cpay_${randomBytes(6).toString('hex')}`;

    // 1. Insert payment record
    const payRes = await query(
      `INSERT INTO client_payments (id, client_id, amount, payment_date, note, created_at)
       VALUES ($1, $2, $3, $4, $5, now())
       RETURNING *;`,
      [paymentId, clientId, amount, paymentDate, note]
    );

    const payment = {
      ...payRes.rows[0],
      amount: Number(payRes.rows[0].amount) || 0,
    };

    // 2. Atomically update client total_paid, outstanding_balance, and last_payment_date
    const clientUpdateRes = await query(
      `UPDATE clients
       SET
         total_paid = COALESCE(total_paid, 0) + $1,
         outstanding_balance = GREATEST(0, COALESCE(agreed_amount, project_value, 0) - (COALESCE(total_paid, 0) + $1)),
         last_payment_date = $2,
         updated_at = now()
       WHERE id = $3
       RETURNING total_paid, outstanding_balance, agreed_amount, last_payment_date, company;`,
      [amount, paymentDate, clientId]
    );

    const updatedClient = clientUpdateRes.rows[0];

    // 3. Log activity
    await query(
      `INSERT INTO activity_logs (id, actor_name, actor_role, action_type, entity_type, entity_id, entity_name, description)
       VALUES ($1, 'Admin', 'admin', 'payment_received', 'client', $2, $3, $4);`,
      [
        `act_${randomBytes(6).toString('hex')}`,
        clientId,
        updatedClient?.company || 'Client',
        `Recorded payment of ₹${amount.toLocaleString()} for ${updatedClient?.company || 'client'}`,
      ]
    ).catch(() => {});

    return NextResponse.json({
      payment,
      clientTotals: updatedClient ? {
        total_paid: Number(updatedClient.total_paid) || 0,
        outstanding_balance: Number(updatedClient.outstanding_balance) || 0,
        last_payment_date: updatedClient.last_payment_date,
      } : null,
    }, { status: 201 });

  } catch (error) {
    console.error('[POST /api/clients/[id]/payments failed]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record payment' },
      { status: 500 }
    );
  }
}
