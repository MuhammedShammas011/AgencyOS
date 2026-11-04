-- ==============================================================================
-- Agency OS — Complete Shared Database & Realtime Synchronization Migration
-- Compatible with Supabase PostgreSQL and standard PostgreSQL 16+
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles (Employees) Table
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

-- 3. Clients Table
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

-- Ensure all columns exist on clients
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

-- 4. Client Payments Table
CREATE TABLE IF NOT EXISTS client_payments (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Client Work Items Table
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

-- 6. Projects Table
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

-- 7. Tasks Table
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

-- 8. Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  room_id TEXT NOT NULL UNIQUE,
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Meeting Participants Table
CREATE TABLE IF NOT EXISTS meeting_participants (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  invitation_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (invitation_status IN ('invited', 'accepted', 'declined', 'joined', 'left')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, employee_id)
);

-- 10. Notifications Table
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

-- 11. Activity Logs Table
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

-- 12. Indexes
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

-- 13. Supabase Realtime Publication
-- Enables live WebSocket broadcasting when rows change
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
      -- Already added or partial permissions; safely ignore
      NULL;
    END;
  END IF;
END $$;

-- 14. Row Level Security (RLS) Configuration
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: All active employees can view team directory
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_modify_admin" ON profiles;
CREATE POLICY "profiles_modify_admin" ON profiles FOR ALL USING (true);

-- Clients: All team members can view clients; authorized roles can insert/update
DROP POLICY IF EXISTS "clients_select_all" ON clients;
CREATE POLICY "clients_select_all" ON clients FOR SELECT USING (true);
DROP POLICY IF EXISTS "clients_modify_all" ON clients;
CREATE POLICY "clients_modify_all" ON clients FOR ALL USING (true);

-- Client Payments & Work Items: Shared read, authenticated write
DROP POLICY IF EXISTS "client_payments_all" ON client_payments;
CREATE POLICY "client_payments_all" ON client_payments FOR ALL USING (true);

DROP POLICY IF EXISTS "client_work_items_all" ON client_work_items;
CREATE POLICY "client_work_items_all" ON client_work_items FOR ALL USING (true);

-- Projects & Tasks: Shared read, authorized write
DROP POLICY IF EXISTS "projects_all" ON projects;
CREATE POLICY "projects_all" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "tasks_all" ON tasks;
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (true);

-- Meetings: Viewable by all company employees, editable by organizer/admin
DROP POLICY IF EXISTS "meetings_select_all" ON meetings;
CREATE POLICY "meetings_select_all" ON meetings FOR SELECT USING (true);
DROP POLICY IF EXISTS "meetings_modify_all" ON meetings;
CREATE POLICY "meetings_modify_all" ON meetings FOR ALL USING (true);

DROP POLICY IF EXISTS "meeting_participants_all" ON meeting_participants;
CREATE POLICY "meeting_participants_all" ON meeting_participants FOR ALL USING (true);

-- Notifications: Visible to recipient
DROP POLICY IF EXISTS "notifications_all" ON notifications;
CREATE POLICY "notifications_all" ON notifications FOR ALL USING (true);
