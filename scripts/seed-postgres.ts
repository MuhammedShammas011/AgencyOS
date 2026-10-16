import { Pool } from 'pg';
import {
  INITIAL_USERS,
  INITIAL_CLIENTS,
  INITIAL_LEADS,
  INITIAL_PROPOSALS,
  INITIAL_PROJECTS,
  INITIAL_DELIVERABLES,
  INITIAL_TASKS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CLIENT_CLOSURES,
  INITIAL_INTERACTIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_NOTIFICATIONS,
} from '../src/lib/data/initial-data';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/agency_os';

const pool = new Pool({ connectionString });

async function seed() {
  const client = await pool.connect();
  console.log('🚀 Connecting to PostgreSQL (agency_os)...');

  try {
    await client.query('BEGIN');

    // 1. Profiles
    console.log(`Seeding ${INITIAL_USERS.length} profiles...`);
    for (const u of INITIAL_USERS) {
      await client.query(
        `INSERT INTO profiles (id, name, email, role, department, title, avatar_url, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           role = EXCLUDED.role,
           department = EXCLUDED.department,
           title = EXCLUDED.title,
           avatar_url = EXCLUDED.avatar_url,
           is_active = EXCLUDED.is_active;`,
        [
          u.id,
          u.name,
          u.email,
          u.role,
          u.department,
          u.title,
          u.avatar_url || null,
          u.is_active,
          u.created_at,
        ]
      );
    }

    // 2. Clients
    console.log(`Seeding ${INITIAL_CLIENTS.length} clients...`);
    for (const c of INITIAL_CLIENTS) {
      await client.query(
        `INSERT INTO clients (
          id, name, company, industry, status, health_score, account_manager_id, sales_owner_id,
          services, acquisition_source, referring_person, monthly_retainer, project_value,
          total_invoiced, total_paid, outstanding_balance, lifetime_value, contract_start_date,
          contract_end_date, next_action, next_action_due, website, address, internal_notes,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26
        ) ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          company = EXCLUDED.company,
          industry = EXCLUDED.industry,
          status = EXCLUDED.status,
          health_score = EXCLUDED.health_score,
          account_manager_id = EXCLUDED.account_manager_id,
          sales_owner_id = EXCLUDED.sales_owner_id,
          services = EXCLUDED.services,
          monthly_retainer = EXCLUDED.monthly_retainer,
          total_invoiced = EXCLUDED.total_invoiced,
          total_paid = EXCLUDED.total_paid,
          outstanding_balance = EXCLUDED.outstanding_balance;`,
        [
          c.id,
          c.name,
          c.company,
          c.industry,
          c.status,
          c.health_score,
          c.account_manager_id || null,
          c.sales_owner_id || null,
          c.services,
          c.acquisition_source_id || null,
          c.referring_person || null,
          c.monthly_retainer || 0,
          c.project_value || 0,
          c.total_invoiced || 0,
          c.total_paid || 0,
          c.outstanding_balance || 0,
          c.lifetime_value || 0,
          c.contract_start_date,
          c.contract_end_date || null,
          c.next_action || null,
          c.next_action_due || null,
          c.website || null,
          c.address || null,
          c.internal_notes || null,
          c.created_at,
          c.updated_at,
        ]
      );
    }

    // 3. Leads
    console.log(`Seeding ${INITIAL_LEADS.length} leads...`);
    for (const l of INITIAL_LEADS) {
      await client.query(
        `INSERT INTO leads (
          id, name, company, email, phone, industry, acquisition_source, referring_person,
          lead_owner_id, estimated_deal_value, deal_type, stage, confidence_level,
          next_follow_up, notes, lost_reason, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          l.id,
          l.name,
          l.company,
          l.email,
          l.phone || null,
          l.industry || null,
          l.acquisition_source,
          l.referring_person || null,
          l.lead_owner_id || null,
          l.estimated_deal_value || 0,
          l.deal_type || 'retainer',
          l.stage,
          l.confidence_level || 'medium',
          l.next_follow_up || null,
          l.notes || null,
          l.lost_reason || null,
          l.created_at,
          l.updated_at,
        ]
      );
    }

    // 4. Proposals
    console.log(`Seeding ${INITIAL_PROPOSALS.length} proposals...`);
    for (const p of INITIAL_PROPOSALS) {
      await client.query(
        `INSERT INTO proposals (
          id, proposal_number, client_id, client_name, company, lead_id, sales_owner_id,
          version, status, subtotal, discount_rate, discount_amount, tax_rate, tax_amount,
          total_quoted_value, currency, valid_until, expected_decision_date, sent_date,
          viewed_date, accepted_date, rejection_reason, client_feedback, document_url,
          resulting_project_id, notes, items, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          p.id,
          p.proposal_number,
          p.client_id || null,
          p.client_name,
          p.company,
          p.lead_id || null,
          p.sales_owner_id || null,
          p.version || 1,
          p.status,
          p.subtotal || 0,
          p.discount_rate || 0,
          p.discount_amount || 0,
          p.tax_rate || 18,
          p.tax_amount || 0,
          p.total_quoted_value || 0,
          p.currency || 'INR',
          p.valid_until,
          p.expected_decision_date || null,
          p.sent_date || null,
          p.viewed_date || null,
          p.accepted_date || null,
          p.rejection_reason || null,
          p.client_feedback || null,
          p.document_url || null,
          p.resulting_project_id || null,
          p.notes || null,
          JSON.stringify(p.items || []),
          p.created_at,
          p.updated_at,
        ]
      );
    }

    // 5. Projects
    console.log(`Seeding ${INITIAL_PROJECTS.length} projects...`);
    for (const pr of INITIAL_PROJECTS) {
      await client.query(
        `INSERT INTO projects (
          id, name, client_id, proposal_id, project_owner_id, account_manager_id,
          status, progress_percent, budget, spent_amount, services, contracted_scope,
          start_date, deadline, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          pr.id,
          pr.name,
          pr.client_id,
          pr.proposal_id || null,
          pr.project_owner_id || null,
          pr.account_manager_id || null,
          pr.status,
          pr.progress_percent || 0,
          pr.budget || 0,
          pr.spent_amount || 0,
          pr.services || [],
          pr.contracted_scope || '',
          pr.start_date,
          pr.deadline,
          pr.completed_at || null,
          pr.created_at,
          pr.updated_at,
        ]
      );
    }

    // 6. Deliverables
    console.log(`Seeding ${INITIAL_DELIVERABLES.length} deliverables...`);
    for (const d of INITIAL_DELIVERABLES) {
      await client.query(
        `INSERT INTO deliverables (
          id, title, deliverable_type, project_id, client_id, assigned_owner_id,
          due_date, status, current_version, file_or_preview_url, internal_review_status,
          client_approval_status, revision_count, latest_submission_date, approved_at,
          notes, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          d.id,
          d.title,
          d.deliverable_type,
          d.project_id,
          d.client_id,
          d.assigned_owner_id || null,
          d.due_date,
          d.status,
          d.current_version || 1,
          d.file_or_preview_url || null,
          d.internal_review_status || 'pending',
          d.client_approval_status || 'pending',
          d.revision_count || 0,
          d.latest_submission_date || null,
          d.approved_at || null,
          d.notes || null,
          d.created_at,
          d.updated_at,
        ]
      );
    }

    // 7. Tasks
    console.log(`Seeding ${INITIAL_TASKS.length} tasks...`);
    for (const t of INITIAL_TASKS) {
      await client.query(
        `INSERT INTO tasks (
          id, project_id, deliverable_id, title, description, assigned_to_id,
          priority, status, estimated_hours, actual_hours, start_date, due_date,
          completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          t.id,
          t.project_id,
          t.deliverable_id || null,
          t.title,
          t.description || null,
          t.assigned_to_id || null,
          t.priority || 'medium',
          t.status || 'todo',
          t.estimated_hours || 0,
          t.actual_hours || 0,
          t.start_date || null,
          t.due_date,
          t.completed_at || null,
          t.created_at,
          t.updated_at,
        ]
      );
    }

    // 8. Invoices
    console.log(`Seeding ${INITIAL_INVOICES.length} invoices...`);
    for (const inv of INITIAL_INVOICES) {
      await client.query(
        `INSERT INTO invoices (
          id, invoice_number, client_id, project_id, issue_date, due_date,
          subtotal, tax_rate, tax_amount, total_amount, amount_paid, outstanding_amount,
          status, payment_terms, notes, items, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          inv.id,
          inv.invoice_number,
          inv.client_id,
          inv.project_id || null,
          inv.issue_date,
          inv.due_date,
          inv.subtotal || 0,
          inv.tax_rate || 18,
          inv.tax_amount || 0,
          inv.total_amount || 0,
          inv.amount_paid || 0,
          inv.outstanding_amount || 0,
          inv.status,
          inv.payment_terms || 'Net 15',
          inv.notes || null,
          JSON.stringify(inv.items || []),
          inv.created_at,
          inv.updated_at,
        ]
      );

      // Seed payments for paid / partially paid invoices
      if (inv.payments && inv.payments.length > 0) {
        for (const pay of inv.payments) {
          await client.query(
            `INSERT INTO payments (
              id, invoice_id, amount, payment_date, payment_method,
              transaction_reference, recorded_by_name, notes, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING;`,
            [
              pay.id,
              pay.invoice_id,
              pay.amount,
              pay.payment_date,
              pay.payment_method,
              pay.transaction_reference,
              pay.recorded_by_name,
              pay.notes || null,
              pay.created_at,
            ]
          );
        }
      }
    }

    // 9. Expenses
    console.log(`Seeding ${INITIAL_EXPENSES.length} expenses...`);
    for (const exp of INITIAL_EXPENSES) {
      await client.query(
        `INSERT INTO expenses (
          id, title, category, vendor, amount, tax_amount, expense_date,
          payment_status, client_id, project_id, receipt_url, notes, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          exp.id,
          exp.title,
          exp.category,
          exp.vendor,
          exp.amount,
          exp.tax_amount || 0,
          exp.expense_date,
          exp.payment_status || 'paid',
          exp.client_id || null,
          exp.project_id || null,
          exp.receipt_url || null,
          exp.notes || null,
          exp.created_at,
        ]
      );
    }

    // 10. Client Closures
    console.log(`Seeding ${INITIAL_CLIENT_CLOSURES.length} client closures...`);
    for (const cls of INITIAL_CLIENT_CLOSURES) {
      await client.query(
        `INSERT INTO client_closures (
          id, client_id, client_name, closure_date, last_working_date,
          primary_loss_reason, secondary_loss_reason, detailed_explanation,
          client_feedback_verbatim, is_confirmed_feedback, account_manager_at_closure_id,
          outstanding_invoices_settled, unsettled_balance, pending_deliverables_cleared,
          contract_status_at_exit, recovery_opportunity, recovery_follow_up_date,
          recovery_notes, annual_revenue_lost, relationship_duration_days, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20, $21
        ) ON CONFLICT (id) DO NOTHING;`,
        [
          cls.id,
          cls.client_id,
          cls.client_name,
          cls.closure_date,
          cls.last_working_date,
          cls.primary_loss_reason,
          cls.secondary_loss_reason || null,
          cls.detailed_explanation,
          cls.client_feedback_verbatim || null,
          cls.is_confirmed_feedback !== false,
          cls.account_manager_at_closure_id || null,
          cls.outstanding_invoices_settled !== false,
          cls.unsettled_balance || 0,
          cls.pending_deliverables_cleared !== false,
          cls.contract_status_at_exit,
          cls.recovery_opportunity || 'None',
          cls.recovery_follow_up_date || null,
          cls.recovery_notes || null,
          cls.annual_revenue_lost || 0,
          cls.relationship_duration_days || 0,
          cls.created_at,
        ]
      );
    }

    // 11. Client Interactions
    console.log(`Seeding ${INITIAL_INTERACTIONS.length} client interactions...`);
    for (const ci of INITIAL_INTERACTIONS) {
      await client.query(
        `INSERT INTO client_interactions (
          id, client_id, type, title, summary, sentiment, recorded_by_name,
          action_items, follow_up_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;`,
        [
          ci.id,
          ci.client_id,
          ci.type,
          ci.title,
          ci.summary,
          ci.sentiment || 'neutral',
          ci.recorded_by_name,
          ci.action_items || [],
          ci.follow_up_date || null,
          ci.created_at,
        ]
      );
    }

    // 12. Notifications
    console.log(`Seeding ${INITIAL_NOTIFICATIONS.length} notifications...`);
    for (const notif of INITIAL_NOTIFICATIONS) {
      await client.query(
        `INSERT INTO notifications (
          id, recipient_profile_id, title, message, type, urgency, link_url, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING;`,
        [
          notif.id,
          null,
          notif.title,
          notif.message,
          notif.type,
          notif.urgency || 'medium',
          notif.link_url || '/dashboard',
          notif.is_read || false,
          notif.created_at,
        ]
      );
    }

    // 13. Activity Logs
    console.log(`Seeding ${INITIAL_ACTIVITY_LOGS.length} activity logs...`);
    for (const act of INITIAL_ACTIVITY_LOGS) {
      await client.query(
        `INSERT INTO activity_logs (
          id, actor_name, actor_role, action_type, entity_type, entity_id,
          entity_name, description, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING;`,
        [
          act.id,
          act.actor_name,
          act.actor_role,
          act.action_type,
          act.entity_type,
          act.entity_id,
          act.entity_name,
          act.description,
          JSON.stringify(act.metadata || {}),
          act.created_at,
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seeding completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during seeding:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
