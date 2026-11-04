import { NextRequest, NextResponse, connection } from 'next/server';
import { query } from '@/lib/db';
import { ensureDatabaseTables } from '@/lib/db/init';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_DELIVERABLES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_LEADS,
  INITIAL_PROPOSALS,
  INITIAL_NOTIFICATIONS,
} from '@/lib/data/initial-data';

export async function GET(request: NextRequest) {
  await connection();

  try {
    await ensureDatabaseTables();

    // Query all entities from the central PostgreSQL database in parallel
    const [
      profilesRes,
      clientsRes,
      paymentsRes,
      workItemsRes,
      projectsRes,
      tasksRes,
      deliverablesRes,
      invoicesRes,
      expensesRes,
      leadsRes,
      proposalsRes,
      notificationsRes,
    ] = await Promise.all([
      query('SELECT * FROM profiles ORDER BY name ASC'),
      query('SELECT * FROM clients ORDER BY created_at DESC'),
      query('SELECT * FROM client_payments ORDER BY payment_date DESC, created_at DESC'),
      query('SELECT * FROM client_work_items ORDER BY created_at DESC'),
      query('SELECT * FROM projects ORDER BY created_at DESC'),
      query('SELECT * FROM tasks ORDER BY due_date ASC, created_at DESC'),
      query('SELECT * FROM deliverables ORDER BY due_date ASC, created_at DESC'),
      query('SELECT * FROM invoices ORDER BY issue_date DESC, created_at DESC'),
      query('SELECT * FROM expenses ORDER BY expense_date DESC, created_at DESC'),
      query('SELECT * FROM leads ORDER BY created_at DESC'),
      query('SELECT * FROM proposals ORDER BY created_at DESC'),
      query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'),
    ]);

    // Format clients numbers correctly (pg returns numerics as strings)
    const clients = clientsRes.rows.map((c: any) => ({
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

    const clientPayments = paymentsRes.rows.map((p: any) => ({
      ...p,
      amount: Number(p.amount) || 0,
    }));

    const clientWorkItems = workItemsRes.rows.map((w: any) => ({
      ...w,
      progress: Number(w.progress) || 0,
    }));

    const projects = projectsRes.rows.map((p: any) => ({
      ...p,
      budget: Number(p.budget) || 0,
      spent_amount: Number(p.spent_amount) || 0,
      progress_percent: Number(p.progress_percent) || 0,
      services: Array.isArray(p.services) ? p.services : [],
      team_member_ids: Array.isArray(p.team_member_ids) ? p.team_member_ids : [],
    }));

    const tasks = tasksRes.rows.map((t: any) => ({
      ...t,
      estimated_hours: Number(t.estimated_hours) || 0,
      actual_hours: Number(t.actual_hours) || 0,
    }));

    const deliverables = deliverablesRes.rows.map((d: any) => ({
      ...d,
      current_version: Number(d.current_version) || 1,
      revision_count: Number(d.revision_count) || 0,
      versions: Array.isArray(d.versions) ? d.versions : [],
    }));

    const invoices = invoicesRes.rows.map((inv: any) => ({
      ...inv,
      subtotal: Number(inv.subtotal) || 0,
      tax_rate: Number(inv.tax_rate) || 0,
      tax_amount: Number(inv.tax_amount) || 0,
      total_amount: Number(inv.total_amount) || 0,
      amount_paid: Number(inv.amount_paid) || 0,
      outstanding_amount: Number(inv.outstanding_amount) || 0,
      items: Array.isArray(inv.items) ? inv.items : [],
      payments: Array.isArray(inv.payments) ? inv.payments : [],
    }));

    const expenses = expensesRes.rows.map((e: any) => ({
      ...e,
      amount: Number(e.amount) || 0,
      tax_amount: Number(e.tax_amount) || 0,
    }));

    const leads = leadsRes.rows.map((l: any) => ({
      ...l,
      estimated_deal_value: Number(l.estimated_deal_value) || 0,
    }));

    const proposals = proposalsRes.rows.map((prop: any) => ({
      ...prop,
      version: Number(prop.version) || 1,
      subtotal: Number(prop.subtotal) || 0,
      discount_rate: Number(prop.discount_rate) || 0,
      discount_amount: Number(prop.discount_amount) || 0,
      tax_rate: Number(prop.tax_rate) || 0,
      tax_amount: Number(prop.tax_amount) || 0,
      total_quoted_value: Number(prop.total_quoted_value) || 0,
      items: Array.isArray(prop.items) ? prop.items : [],
      versions: Array.isArray(prop.versions) ? prop.versions : [],
    }));

    return NextResponse.json({
      success: true,
      synced_at: new Date().toISOString(),
      users: profilesRes.rows.length > 0 ? profilesRes.rows : INITIAL_USERS,
      clients: clients.length > 0 ? clients : INITIAL_CLIENTS,
      clientPayments,
      clientWorkItems,
      projects: projects.length > 0 ? projects : INITIAL_PROJECTS,
      tasks: tasks.length > 0 ? tasks : INITIAL_TASKS,
      deliverables: deliverables.length > 0 ? deliverables : INITIAL_DELIVERABLES,
      invoices: invoices.length > 0 ? invoices : INITIAL_INVOICES,
      expenses: expenses.length > 0 ? expenses : INITIAL_EXPENSES,
      leads: leads.length > 0 ? leads : INITIAL_LEADS,
      proposals: proposals.length > 0 ? proposals : INITIAL_PROPOSALS,
      notifications: notificationsRes.rows.length > 0 ? notificationsRes.rows : INITIAL_NOTIFICATIONS,
    });
  } catch (error) {
    console.error('[GET /api/sync failed]', error);
    // Graceful fallback to initial data so ERP never breaks if database is temporarily connecting
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database sync failed',
      users: INITIAL_USERS,
      clients: INITIAL_CLIENTS,
      clientPayments: [],
      clientWorkItems: [],
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      deliverables: INITIAL_DELIVERABLES,
      invoices: INITIAL_INVOICES,
      expenses: INITIAL_EXPENSES,
      leads: INITIAL_LEADS,
      proposals: INITIAL_PROPOSALS,
      notifications: INITIAL_NOTIFICATIONS,
    });
  }
}
