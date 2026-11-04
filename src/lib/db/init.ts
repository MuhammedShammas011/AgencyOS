import { query } from '@/lib/db';
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

let setupPromise: Promise<void> | null = null;

/**
 * Idempotently ensures all required tables, constraints, indexes,
 * default seeds, and Supabase Realtime publications exist in PostgreSQL.
 * Safe to call on every request (cached in memory after first success).
 */
export async function ensureDatabaseTables(): Promise<void> {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      // 1. Profiles (Employees) table
      await query(`
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'creative',
          department TEXT NOT NULL,
          title TEXT NOT NULL,
          avatar_url TEXT,
          phone TEXT,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Seed initial profiles
      for (const u of INITIAL_USERS) {
        await query(
          `INSERT INTO profiles (id, name, email, role, department, title, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             role = EXCLUDED.role,
             department = EXCLUDED.department,
             title = EXCLUDED.title;`,
          [u.id, u.name, u.email, u.role, u.department, u.title]
        );
      }

      // 2. Clients table
      await query(`
        CREATE TABLE IF NOT EXISTS clients (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          industry TEXT DEFAULT 'General',
          status TEXT NOT NULL DEFAULT 'onboarding',
          health_score INT NOT NULL DEFAULT 90,
          email TEXT,
          phone TEXT,
          account_manager_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          account_manager_name TEXT,
          sales_owner_id TEXT,
          sales_owner_name TEXT,
          services TEXT[] NOT NULL DEFAULT '{}',
          acquisition_source_id TEXT DEFAULT 'source_direct',
          acquisition_source_name TEXT DEFAULT 'Direct Outreach',
          referring_person TEXT,
          monthly_retainer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          project_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          agreed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          total_invoiced NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          lifetime_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          payment_due_date DATE,
          last_payment_date DATE,
          contract_start_date DATE,
          contract_end_date DATE,
          next_action TEXT,
          next_action_due DATE,
          website TEXT,
          address TEXT,
          internal_notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Add missing columns if existing table didn't have them
      await query(`
        ALTER TABLE clients
          ADD COLUMN IF NOT EXISTS agreed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          ADD COLUMN IF NOT EXISTS payment_due_date DATE,
          ADD COLUMN IF NOT EXISTS last_payment_date DATE,
          ADD COLUMN IF NOT EXISTS email TEXT,
          ADD COLUMN IF NOT EXISTS phone TEXT,
          ADD COLUMN IF NOT EXISTS account_manager_name TEXT,
          ADD COLUMN IF NOT EXISTS sales_owner_name TEXT,
          ADD COLUMN IF NOT EXISTS acquisition_source_id TEXT DEFAULT 'source_direct',
          ADD COLUMN IF NOT EXISTS acquisition_source_name TEXT DEFAULT 'Direct Outreach';
      `);

      // Seed initial clients if empty
      const clientCountRes = await query<{ count: string }>('SELECT count(*)::text as count FROM clients');
      if (parseInt(clientCountRes.rows[0]?.count || '0', 10) === 0) {
        for (const c of INITIAL_CLIENTS) {
          await query(
            `INSERT INTO clients (
              id, name, company, industry, status, health_score, email, phone,
              account_manager_id, account_manager_name, sales_owner_id, sales_owner_name,
              services, acquisition_source_id, acquisition_source_name, referring_person,
              monthly_retainer, project_value, agreed_amount, total_invoiced, total_paid,
              outstanding_balance, lifetime_value, payment_due_date, last_payment_date,
              contract_start_date, contract_end_date, next_action, next_action_due, website,
              internal_notes, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8,
              $9, $10, $11, $12,
              $13, $14, $15, $16,
              $17, $18, $19, $20, $21,
              $22, $23, $24, $25,
              $26, $27, $28, $29, $30,
              $31, $32, $33
            ) ON CONFLICT (id) DO NOTHING;`,
            [
              c.id, c.name, c.company, c.industry || 'Creative Agency', c.status, c.health_score, c.email || null, c.phone || null,
              c.account_manager_id || null, c.account_manager_name || null, c.sales_owner_id || null, c.sales_owner_name || null,
              c.services || [], c.acquisition_source_id || 'source_direct', c.acquisition_source_name || 'Direct Outreach', c.referring_person || null,
              c.monthly_retainer || 0, c.project_value || 0, c.agreed_amount ?? c.project_value ?? 0, c.total_invoiced || 0, c.total_paid || 0,
              c.outstanding_balance || 0, c.lifetime_value || 0, c.payment_due_date || null, c.last_payment_date || null,
              c.contract_start_date || new Date().toISOString().split('T')[0], c.contract_end_date || null, c.next_action || null, c.next_action_due || null, c.website || null,
              c.internal_notes || null, c.created_at || new Date().toISOString(), c.updated_at || new Date().toISOString()
            ]
          );
        }
      }

      // 3. Client Payments table
      await query(`
        CREATE TABLE IF NOT EXISTS client_payments (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          amount NUMERIC(12, 2) NOT NULL,
          payment_date DATE NOT NULL,
          note TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 4. Client Work Items table
      await query(`
        CREATE TABLE IF NOT EXISTS client_work_items (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          service TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'not_started',
          progress INT NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 5. Projects table
      await query(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL,
          proposal_id TEXT,
          project_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          project_owner_name TEXT,
          account_manager_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          account_manager_name TEXT,
          team_member_ids TEXT[] NOT NULL DEFAULT '{}',
          status TEXT NOT NULL DEFAULT 'planning',
          progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
          budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          services TEXT[] NOT NULL DEFAULT '{}',
          contracted_scope TEXT NOT NULL DEFAULT '',
          start_date DATE NOT NULL,
          deadline DATE NOT NULL,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Seed initial projects if empty
      const projCountRes = await query<{ count: string }>('SELECT count(*)::text as count FROM projects');
      if (parseInt(projCountRes.rows[0]?.count || '0', 10) === 0) {
        for (const p of INITIAL_PROJECTS) {
          await query(
            `INSERT INTO projects (
              id, name, client_id, client_name, proposal_id, project_owner_id, project_owner_name,
              account_manager_id, account_manager_name, team_member_ids, status, progress_percent,
              budget, spent_amount, services, contracted_scope, start_date, deadline, completed_at, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19, $20, $21
            ) ON CONFLICT (id) DO NOTHING;`,
            [
              p.id, p.name, p.client_id, p.client_name, p.proposal_id || null, p.project_owner_id || null, p.project_owner_name || null,
              p.account_manager_id || null, p.account_manager_name || null, p.team_member_ids || [], p.status, p.progress_percent || 0,
              p.budget || 0, p.spent_amount || 0, p.services || [], p.contracted_scope || '', p.start_date, p.deadline, p.completed_at || null,
              p.created_at || new Date().toISOString(), p.updated_at || new Date().toISOString()
            ]
          );
        }
      }

      // 6. Tasks table
      await query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          project_name TEXT,
          client_id TEXT,
          client_name TEXT,
          deliverable_id TEXT,
          title TEXT NOT NULL,
          description TEXT,
          assigned_to_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          assigned_to_name TEXT,
          priority TEXT NOT NULL DEFAULT 'medium',
          status TEXT NOT NULL DEFAULT 'todo',
          estimated_hours NUMERIC(6, 2) DEFAULT 0.00,
          actual_hours NUMERIC(6, 2) DEFAULT 0.00,
          start_date DATE,
          due_date DATE NOT NULL,
          completed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Seed initial tasks if empty
      const taskCountRes = await query<{ count: string }>('SELECT count(*)::text as count FROM tasks');
      if (parseInt(taskCountRes.rows[0]?.count || '0', 10) === 0) {
        for (const t of INITIAL_TASKS) {
          await query(
            `INSERT INTO tasks (
              id, project_id, project_name, client_id, client_name, deliverable_id,
              title, description, assigned_to_id, assigned_to_name, priority, status,
              estimated_hours, actual_hours, start_date, due_date, completed_at, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11, $12,
              $13, $14, $15, $16, $17, $18, $19
            ) ON CONFLICT (id) DO NOTHING;`,
            [
              t.id, t.project_id, t.project_name || null, t.client_id || null, t.client_name || null, t.deliverable_id || null,
              t.title, t.description || null, t.assigned_to_id || null, t.assigned_to_name || null, t.priority, t.status,
              t.estimated_hours || 0, t.actual_hours || 0, t.start_date || null, t.due_date, t.completed_at || null,
              t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString()
            ]
          );
        }
      }

      // 7. Deliverables table
      await query(`
        CREATE TABLE IF NOT EXISTS deliverables (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          deliverable_type TEXT NOT NULL,
          project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          project_name TEXT NOT NULL,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL,
          assigned_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          assigned_owner_name TEXT,
          due_date DATE NOT NULL,
          status TEXT NOT NULL DEFAULT 'not_started',
          current_version INT NOT NULL DEFAULT 1,
          file_or_preview_url TEXT,
          internal_review_status TEXT NOT NULL DEFAULT 'pending',
          client_approval_status TEXT NOT NULL DEFAULT 'pending',
          revision_count INT NOT NULL DEFAULT 0,
          latest_submission_date TIMESTAMPTZ,
          approved_at TIMESTAMPTZ,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 8. Invoices table
      await query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          invoice_number TEXT NOT NULL UNIQUE,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL,
          project_id TEXT,
          project_name TEXT,
          issue_date DATE NOT NULL,
          due_date DATE NOT NULL,
          subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
          tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          status TEXT NOT NULL DEFAULT 'draft',
          payment_terms TEXT DEFAULT 'Net 15',
          notes TEXT,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          payments JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 9. Expenses table
      await query(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          vendor TEXT NOT NULL,
          amount NUMERIC(12, 2) NOT NULL,
          tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          expense_date DATE NOT NULL,
          payment_status TEXT NOT NULL DEFAULT 'paid',
          client_id TEXT,
          client_name TEXT,
          project_id TEXT,
          receipt_url TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 10. Leads table
      await query(`
        CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          industry TEXT,
          acquisition_source TEXT NOT NULL,
          referring_person TEXT,
          lead_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          lead_owner_name TEXT,
          estimated_deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          deal_type TEXT NOT NULL DEFAULT 'retainer',
          stage TEXT NOT NULL DEFAULT 'new',
          confidence_level TEXT DEFAULT 'medium',
          next_follow_up DATE,
          notes TEXT,
          lost_reason TEXT,
          converted_client_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 11. Proposals table
      await query(`
        CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY,
          proposal_number TEXT NOT NULL UNIQUE,
          client_id TEXT,
          client_name TEXT NOT NULL,
          company TEXT NOT NULL,
          lead_id TEXT,
          sales_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
          sales_owner_name TEXT,
          version INT NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'draft',
          subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
          discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
          tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          total_quoted_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          currency TEXT NOT NULL DEFAULT 'INR',
          valid_until DATE NOT NULL,
          expected_decision_date DATE,
          sent_date DATE,
          viewed_date DATE,
          accepted_date DATE,
          rejection_reason TEXT,
          client_feedback TEXT,
          document_url TEXT,
          resulting_project_id TEXT,
          notes TEXT,
          items JSONB NOT NULL DEFAULT '[]'::jsonb,
          versions JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 12. Meetings table
      await query(`
        CREATE TABLE IF NOT EXISTS meetings (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          room_id TEXT NOT NULL UNIQUE,
          organizer_id TEXT NOT NULL,
          organizer_name TEXT NOT NULL,
          scheduled_at TIMESTAMPTZ,
          duration_minutes INT NOT NULL DEFAULT 60,
          status TEXT NOT NULL DEFAULT 'scheduled',
          ended_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 13. Meeting participants table
      await query(`
        CREATE TABLE IF NOT EXISTS meeting_participants (
          id TEXT PRIMARY KEY,
          meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
          employee_id TEXT NOT NULL,
          employee_name TEXT NOT NULL,
          invitation_status TEXT NOT NULL DEFAULT 'invited',
          joined_at TIMESTAMPTZ,
          left_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (meeting_id, employee_id)
        );
      `);

      // 14. Notifications table
      await query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          recipient_profile_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL,
          urgency TEXT NOT NULL DEFAULT 'medium',
          link_url TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 15. Activity logs table
      await query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id TEXT PRIMARY KEY,
          actor_name TEXT NOT NULL,
          actor_role TEXT NOT NULL,
          action_type TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          entity_name TEXT NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // 16. Client closures & interactions
      await query(`
        CREATE TABLE IF NOT EXISTS client_closures (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          client_name TEXT NOT NULL,
          closure_date DATE NOT NULL,
          last_working_date DATE NOT NULL,
          primary_loss_reason TEXT NOT NULL,
          secondary_loss_reason TEXT,
          detailed_explanation TEXT NOT NULL,
          client_feedback_verbatim TEXT,
          is_confirmed_feedback BOOLEAN NOT NULL DEFAULT true,
          account_manager_at_closure_id TEXT,
          outstanding_invoices_settled BOOLEAN NOT NULL DEFAULT true,
          unsettled_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          pending_deliverables_cleared BOOLEAN NOT NULL DEFAULT true,
          contract_status_at_exit TEXT NOT NULL,
          recovery_opportunity TEXT NOT NULL DEFAULT 'None',
          recovery_follow_up_date DATE,
          recovery_notes TEXT,
          annual_revenue_lost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
          relationship_duration_days INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS client_interactions (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          sentiment TEXT NOT NULL DEFAULT 'neutral',
          recorded_by_name TEXT NOT NULL,
          action_items TEXT[] DEFAULT '{}',
          follow_up_date DATE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `);

      // Indexes
      await query(`
        CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
        CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(account_manager_id);
        CREATE INDEX IF NOT EXISTS idx_client_payments_client ON client_payments(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_work_items_client ON client_work_items(client_id);
        CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to_id);
        CREATE INDEX IF NOT EXISTS idx_meetings_org ON meetings(organizer_id);
        CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
        CREATE INDEX IF NOT EXISTS idx_meetings_sched ON meetings(scheduled_at);
        CREATE INDEX IF NOT EXISTS idx_mp_meeting ON meeting_participants(meeting_id);
        CREATE INDEX IF NOT EXISTS idx_mp_employee ON meeting_participants(employee_id);
        CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient_profile_id, is_read);
      `);

      // Supabase Realtime Publication Setup (Safe execution if in Supabase)
      await query(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
            BEGIN
              ALTER PUBLICATION supabase_realtime ADD TABLE
                clients,
                client_payments,
                client_work_items,
                projects,
                tasks,
                meetings,
                meeting_participants,
                notifications;
            EXCEPTION WHEN OTHERS THEN
              -- Tables might already be in publication or partial permissions; ignore
              NULL;
            END;
          END IF;
        END $$;
      `);

    } catch (err) {
      console.error('[db:ensureDatabaseTables failed]', err);
      setupPromise = null; // Allow retry on next request
      throw err;
    }
  })();

  return setupPromise;
}

// Backwards-compatible alias for existing code
export const ensureMeetingsDatabaseTables = ensureDatabaseTables;
