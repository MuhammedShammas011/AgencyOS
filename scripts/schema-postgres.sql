-- ==============================================================================
-- Agency OS — Native PostgreSQL Schema
-- Database: agency_os
-- Compatible with PostgreSQL 16+
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if re-running
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS client_interactions CASCADE;
DROP TABLE IF EXISTS client_closures CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS deliverable_versions CASCADE;
DROP TABLE IF EXISTS deliverables CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS proposal_versions CASCADE;
DROP TABLE IF EXISTS proposal_items CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS client_assignments CASCADE;
DROP TABLE IF EXISTS client_contacts CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS lead_stage_history CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS acquisition_sources CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. PROFILES & USERS
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT ('usr_' || substr(md5(random()::text), 1, 12)),
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

-- 2. ACQUISITION SOURCES & REFERRALS
CREATE TABLE acquisition_sources (
  id TEXT PRIMARY KEY DEFAULT ('src_' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref_' || substr(md5(random()::text), 1, 12)),
  referrer_name TEXT NOT NULL,
  referrer_email TEXT,
  referrer_company TEXT,
  relationship_notes TEXT,
  total_referrals_count INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LEADS & PIPELINE
CREATE TABLE leads (
  id TEXT PRIMARY KEY DEFAULT ('lead_' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  acquisition_source TEXT NOT NULL,
  referring_person TEXT,
  lead_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  deal_type TEXT NOT NULL DEFAULT 'retainer',
  stage TEXT NOT NULL DEFAULT 'new',
  confidence_level TEXT DEFAULT 'medium',
  next_follow_up DATE,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_stage_history (
  id TEXT PRIMARY KEY DEFAULT ('lsh_' || substr(md5(random()::text), 1, 12)),
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage TEXT NOT NULL,
  to_stage TEXT NOT NULL,
  changed_by_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CLIENTS & CONTACTS
CREATE TABLE clients (
  id TEXT PRIMARY KEY DEFAULT ('client_' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'onboarding',
  health_score INT NOT NULL DEFAULT 90 CHECK (health_score BETWEEN 0 AND 100),
  account_manager_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  sales_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  acquisition_source TEXT,
  referring_person TEXT,
  monthly_retainer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  project_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_invoiced NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  outstanding_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  lifetime_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  next_action TEXT,
  next_action_due DATE,
  website TEXT,
  address TEXT,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_contacts (
  id TEXT PRIMARY KEY DEFAULT ('cnt_' || substr(md5(random()::text), 1, 12)),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. PROPOSALS & CONTRACTS
CREATE TABLE proposals (
  id TEXT PRIMARY KEY DEFAULT ('prop_' || substr(md5(random()::text), 1, 12)),
  proposal_number TEXT NOT NULL UNIQUE,
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company TEXT NOT NULL,
  lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
  sales_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. PROJECTS, DELIVERABLES & TASKS
CREATE TABLE projects (
  id TEXT PRIMARY KEY DEFAULT ('proj_' || substr(md5(random()::text), 1, 12)),
  name TEXT NOT NULL,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id TEXT REFERENCES proposals(id) ON DELETE SET NULL,
  project_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  account_manager_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  budget NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  spent_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  services TEXT[] NOT NULL DEFAULT '{}',
  contracted_scope TEXT NOT NULL,
  start_date DATE NOT NULL,
  deadline DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliverables (
  id TEXT PRIMARY KEY DEFAULT ('deliv_' || substr(md5(random()::text), 1, 12)),
  title TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TABLE tasks (
  id TEXT PRIMARY KEY DEFAULT ('task_' || substr(md5(random()::text), 1, 12)),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id TEXT REFERENCES deliverables(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
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

-- 7. FINANCIAL INTELLIGENCE (Invoices, Payments, Expenses)
CREATE TABLE invoices (
  id TEXT PRIMARY KEY DEFAULT ('inv_' || substr(md5(random()::text), 1, 12)),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text), 1, 12)),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_reference TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT ('exp_' || substr(md5(random()::text), 1, 12)),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  expense_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. CLIENT RETENTION (Closures & Churn Analysis)
CREATE TABLE client_closures (
  id TEXT PRIMARY KEY DEFAULT ('cls_' || substr(md5(random()::text), 1, 12)),
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  closure_date DATE NOT NULL,
  last_working_date DATE NOT NULL,
  primary_loss_reason TEXT NOT NULL,
  secondary_loss_reason TEXT,
  detailed_explanation TEXT NOT NULL,
  client_feedback_verbatim TEXT,
  is_confirmed_feedback BOOLEAN NOT NULL DEFAULT true,
  account_manager_at_closure_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TABLE client_interactions (
  id TEXT PRIMARY KEY DEFAULT ('int_' || substr(md5(random()::text), 1, 12)),
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

-- 9. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text), 1, 12)),
  recipient_profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium',
  link_url TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activity_logs (
  id TEXT PRIMARY KEY DEFAULT ('act_' || substr(md5(random()::text), 1, 12)),
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

-- INDEXES
CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_owner ON leads(lead_owner_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_account_manager ON clients(account_manager_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverables_due_date ON deliverables(due_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_client_closures_reason ON client_closures(primary_loss_reason);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
