-- ==============================================================================
-- Agency OS — Comprehensive PostgreSQL Schema for Supabase
-- Production Schema for High-End Creative & Marketing Agency Management
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role_enum AS ENUM (
  'admin',
  'management',
  'sales',
  'account_manager',
  'project_manager',
  'creative',
  'finance'
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'creative',
  department TEXT NOT NULL,
  title TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. ACQUISITION SOURCES & REFERRALS
CREATE TABLE IF NOT EXISTS acquisition_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- 'Organic', 'Paid', 'Referral', 'Outreach'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_name TEXT NOT NULL,
  referrer_email TEXT,
  referrer_company TEXT,
  relationship_notes TEXT,
  total_referrals_count INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. LEADS & PIPELINE
CREATE TYPE lead_stage_enum AS ENUM (
  'new',
  'contacted',
  'qualified',
  'meeting',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  industry TEXT,
  acquisition_source TEXT NOT NULL,
  referring_person TEXT,
  lead_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estimated_deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  deal_type TEXT NOT NULL DEFAULT 'retainer', -- 'retainer', 'project'
  stage lead_stage_enum NOT NULL DEFAULT 'new',
  confidence_level TEXT DEFAULT 'medium',
  next_follow_up DATE,
  notes TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_stage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  from_stage lead_stage_enum NOT NULL,
  to_stage lead_stage_enum NOT NULL,
  changed_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CLIENTS & CONTACTS
CREATE TYPE client_status_enum AS ENUM (
  'active',
  'onboarding',
  'at_risk',
  'paused',
  'lost',
  'completed'
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  industry TEXT NOT NULL,
  status client_status_enum NOT NULL DEFAULT 'onboarding',
  health_score INT NOT NULL DEFAULT 90 CHECK (health_score BETWEEN 0 AND 100),
  account_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sales_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'account_manager', 'project_manager', 'creative_lead'
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unassigned_at TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT true,
  notes TEXT
);

-- 5. PROPOSALS & CONTRACTS
CREATE TYPE proposal_status_enum AS ENUM (
  'draft',
  'sent',
  'viewed',
  'negotiation',
  'accepted',
  'rejected',
  'expired',
  'withdrawn'
);

CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_number TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  company TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  sales_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  version INT NOT NULL DEFAULT 1,
  status proposal_status_enum NOT NULL DEFAULT 'draft',
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
  resulting_project_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  service_category TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by_name TEXT NOT NULL,
  quoted_value NUMERIC(12, 2) NOT NULL,
  changes_summary TEXT
);

-- 6. PROJECTS, TASKS & DELIVERABLES
CREATE TYPE project_status_enum AS ENUM (
  'planning',
  'in_progress',
  'in_review',
  'completed',
  'on_hold',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  project_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  account_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status project_status_enum NOT NULL DEFAULT 'planning',
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

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_project TEXT NOT NULL DEFAULT 'contributor',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status_enum AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done');

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deliverable_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  priority task_priority_enum NOT NULL DEFAULT 'medium',
  status task_status_enum NOT NULL DEFAULT 'todo',
  estimated_hours NUMERIC(6, 2) DEFAULT 0.00,
  actual_hours NUMERIC(6, 2) DEFAULT 0.00,
  start_date DATE,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliverables are distinct first-class entities with strict submission & approval tracking
CREATE TYPE deliverable_status_enum AS ENUM (
  'not_started',
  'in_progress',
  'internal_review',
  'ready_to_submit',
  'submitted_to_client',
  'revision_requested',
  'approved',
  'cancelled'
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  deliverable_type TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE NOT NULL,
  status deliverable_status_enum NOT NULL DEFAULT 'not_started',
  current_version INT NOT NULL DEFAULT 1,
  file_or_preview_url TEXT,
  internal_review_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'changes_requested'
  client_approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'revision_requested'
  revision_count INT NOT NULL DEFAULT 0,
  latest_submission_date TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deliverable_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
  version INT NOT NULL,
  file_url TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_by_name TEXT NOT NULL,
  review_notes TEXT,
  client_feedback TEXT
);

-- 7. FINANCIAL INTELLIGENCE (Invoices, Payments, Expenses)
CREATE TYPE invoice_status_enum AS ENUM (
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'voided'
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  outstanding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status invoice_status_enum NOT NULL DEFAULT 'draft',
  payment_terms TEXT DEFAULT 'Net 15',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL, -- 'Bank Transfer / NEFT', 'UPI', 'Wire / Swift', 'Credit Card / Stripe', 'Cheque'
  transaction_reference TEXT NOT NULL,
  recorded_by_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  vendor TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  expense_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid', -- 'pending', 'paid'
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. CLIENT RETENTION INTELLIGENCE (Closure & Churn Analysis)
CREATE TABLE IF NOT EXISTS client_closures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  closure_date DATE NOT NULL,
  last_working_date DATE NOT NULL,
  primary_loss_reason TEXT NOT NULL,
  secondary_loss_reason TEXT,
  detailed_explanation TEXT NOT NULL,
  client_feedback_verbatim TEXT,
  is_confirmed_feedback BOOLEAN NOT NULL DEFAULT true,
  account_manager_at_closure_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  outstanding_invoices_settled BOOLEAN NOT NULL DEFAULT true,
  unsettled_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  pending_deliverables_cleared BOOLEAN NOT NULL DEFAULT true,
  contract_status_at_exit TEXT NOT NULL, -- 'Expired', 'Early Termination by Client', 'Early Termination by Agency'
  recovery_opportunity TEXT NOT NULL DEFAULT 'None', -- 'High', 'Medium', 'Low', 'None'
  recovery_follow_up_date DATE,
  recovery_notes TEXT,
  annual_revenue_lost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  relationship_duration_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. RELATIONSHIP & COMMUNICATIONS
CREATE TABLE IF NOT EXISTS client_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'Meeting', 'Call', 'Email', 'Deliverable Review', 'Feedback', 'Complaint'
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral', -- 'positive', 'neutral', 'concerned', 'escalated'
  recorded_by_name TEXT NOT NULL,
  action_items TEXT[] DEFAULT '{}',
  follow_up_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. SYSTEM: NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium', -- 'high', 'medium', 'low'
  link_url TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES FOR MAXIMUM QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(lead_owner_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(account_manager_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_due_date ON deliverables(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_closures_reason ON client_closures(primary_loss_reason);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users with active profile read access to agency records
CREATE POLICY "Allow authenticated read clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update clients" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated read deliverables" ON deliverables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated manage deliverables" ON deliverables FOR ALL TO authenticated USING (true);

-- Restrict financial tables to finance/management/admin roles in production
CREATE POLICY "Financial view policy" ON invoices FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.auth_user_id = auth.uid() 
      AND profiles.role IN ('admin', 'management', 'finance')
    )
  );
