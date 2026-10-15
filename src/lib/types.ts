// Agency OS — Core Domain TypeScript Definitions

export type UserRole =
  | 'admin'
  | 'management'
  | 'sales'
  | 'account_manager'
  | 'project_manager'
  | 'creative'
  | 'finance';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  department: 'Leadership' | 'Client Success' | 'Design & Creative' | 'Engineering' | 'Performance & Growth' | 'Finance';
  title: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
}

export type ClientStatus = 'active' | 'onboarding' | 'at_risk' | 'paused' | 'lost' | 'completed';

export type ServiceType =
  | 'Social Media Management'
  | 'Graphic & Motion Design'
  | 'Video Production'
  | 'Brand Identity & Strategy'
  | 'Website & App Development'
  | 'Performance Marketing & SEO'
  | 'Commercial Photography'
  | 'Influencer & PR Campaigns';

export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  title: string;
  email: string;
  phone?: string;
  is_primary: boolean;
}

export interface ClientAssignmentHistory {
  id: string;
  client_id: string;
  employee_id: string;
  role: 'account_manager' | 'project_manager' | 'creative_lead' | 'sales_owner';
  assigned_at: string;
  unassigned_at?: string;
  is_current: boolean;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  industry: string;
  status: ClientStatus;
  health_score: number; // 0 - 100
  account_manager_id: string;
  account_manager_name?: string;
  sales_owner_id?: string;
  sales_owner_name?: string;
  services: ServiceType[];
  acquisition_source_id: string;
  acquisition_source_name?: string;
  referring_person?: string;
  monthly_retainer: number; // In currency units (e.g., INR or USD)
  project_value: number;
  total_invoiced: number;
  total_paid: number;
  outstanding_balance: number;
  lifetime_value: number;
  contract_start_date: string;
  contract_end_date?: string;
  next_action?: string;
  next_action_due?: string;
  website?: string;
  address?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export type LeadPipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'meeting'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  industry?: string;
  acquisition_source: 'Instagram' | 'Website' | 'Referral' | 'Meta Ads' | 'Google Search' | 'Networking' | 'Inbound PR' | 'Other';
  referring_person?: string; // Distinct from channel
  lead_owner_id: string; // Distinct from referrer & channel
  lead_owner_name?: string;
  estimated_deal_value: number;
  deal_type: 'retainer' | 'project';
  stage: LeadPipelineStage;
  next_follow_up?: string;
  confidence_level?: 'low' | 'medium' | 'high';
  notes?: string;
  lost_reason?: string;
  converted_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadStageHistory {
  id: string;
  lead_id: string;
  from_stage: LeadPipelineStage;
  to_stage: LeadPipelineStage;
  changed_by_id: string;
  changed_by_name: string;
  notes?: string;
  created_at: string;
}

export type ProposalStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'negotiation'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'withdrawn';

export interface ProposalLineItem {
  id: string;
  description: string;
  service_category: ServiceType;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface ProposalVersion {
  version: number;
  created_at: string;
  created_by_name: string;
  quoted_value: number;
  changes_summary?: string;
}

export interface Proposal {
  id: string;
  proposal_number: string; // e.g. "PROP-2026-089"
  client_id?: string;
  client_name: string;
  company: string;
  lead_id?: string;
  sales_owner_id: string;
  sales_owner_name: string;
  version: number;
  status: ProposalStatus;
  items: ProposalLineItem[];
  subtotal: number;
  discount_rate: number; // percentage
  discount_amount: number;
  tax_rate: number; // percentage (e.g. 18% GST)
  tax_amount: number;
  total_quoted_value: number;
  currency: string;
  valid_until: string;
  expected_decision_date?: string;
  sent_date?: string;
  viewed_date?: string;
  accepted_date?: string;
  rejection_reason?: string;
  client_feedback?: string;
  document_url?: string;
  resulting_project_id?: string;
  versions: ProposalVersion[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'planning' | 'in_progress' | 'in_review' | 'completed' | 'on_hold' | 'cancelled';

export interface Project {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  proposal_id?: string;
  project_owner_id: string; // Project Manager
  project_owner_name: string;
  account_manager_id: string;
  account_manager_name: string;
  team_member_ids: string[];
  status: ProjectStatus;
  progress_percent: number;
  budget: number;
  spent_amount: number;
  services: ServiceType[];
  contracted_scope: string;
  start_date: string;
  deadline: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  client_id?: string;
  client_name?: string;
  deliverable_id?: string;
  title: string;
  description?: string;
  assigned_to_id: string;
  assigned_to_name: string;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_hours: number;
  actual_hours: number;
  start_date?: string;
  due_date: string;
  completed_at?: string;
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export type DeliverableType =
  | 'Brand Identity Book'
  | 'Social Media Feed (12 Posts)'
  | 'Hero Brand Film / TVC'
  | 'Product Commercials'
  | 'E-Commerce Website'
  | 'PPC Ad Creatives & Copy'
  | 'Packaging Design Suite'
  | 'Editorial Photography Assets';

export type DeliverableStatus =
  | 'not_started'
  | 'in_progress'
  | 'internal_review'
  | 'ready_to_submit'
  | 'submitted_to_client'
  | 'revision_requested'
  | 'approved'
  | 'cancelled';

export interface DeliverableVersion {
  version: number;
  file_url: string;
  submitted_at: string;
  submitted_by_name: string;
  review_notes?: string;
  client_feedback?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  deliverable_type: DeliverableType;
  project_id: string;
  project_name: string;
  client_id: string;
  client_name: string;
  assigned_owner_id: string;
  assigned_owner_name: string;
  due_date: string;
  status: DeliverableStatus;
  current_version: number;
  file_or_preview_url?: string;
  internal_review_status: 'pending' | 'passed' | 'changes_requested';
  client_approval_status: 'pending' | 'approved' | 'revision_requested';
  revision_count: number;
  latest_submission_date?: string;
  approved_at?: string;
  versions: DeliverableVersion[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'voided';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface PaymentTransaction {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'Bank Transfer / NEFT' | 'UPI' | 'Wire / Swift' | 'Credit Card / Stripe' | 'Cheque';
  transaction_reference: string;
  recorded_by_name: string;
  notes?: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. "INV-2026-104"
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  issue_date: string;
  due_date: string;
  items: InvoiceLineItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  payment_terms: string;
  payments: PaymentTransaction[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | 'Freelancer & Contractor'
  | 'Software & AI Tools'
  | 'Production & Equipment'
  | 'Media Buying & Ad Spend'
  | 'Travel & Client Hospitality'
  | 'Office & Facilities'
  | 'Legal & Compliance';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  vendor: string;
  amount: number;
  tax_amount: number;
  expense_date: string;
  payment_status: 'pending' | 'paid';
  client_id?: string;
  client_name?: string;
  project_id?: string;
  project_name?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export type LossReason =
  | 'Budget constraints'
  | 'Poor perceived results'
  | 'Communication problems'
  | 'Missed deadlines'
  | 'Quality issues'
  | 'Competitor selected'
  | 'Client business closure'
  | 'Internal strategic decision'
  | 'Service no longer required'
  | 'Contract not renewed'
  | 'Other';

export interface ClientClosureRecord {
  id: string;
  client_id: string;
  client_name: string;
  closure_date: string;
  last_working_date: string;
  primary_loss_reason: LossReason;
  secondary_loss_reason?: LossReason;
  detailed_explanation: string;
  client_feedback_verbatim?: string;
  is_confirmed_feedback: boolean; // Confirmed vs internal assumption
  account_manager_at_closure_id: string;
  account_manager_name: string;
  outstanding_invoices_settled: boolean;
  unsettled_balance: number;
  pending_deliverables_cleared: boolean;
  contract_status_at_exit: 'Expired' | 'Early Termination by Client' | 'Early Termination by Agency';
  recovery_opportunity: 'High' | 'Medium' | 'Low' | 'None';
  recovery_follow_up_date?: string;
  recovery_notes?: string;
  annual_revenue_lost: number;
  relationship_duration_days: number;
  created_at: string;
}

export interface ClientInteraction {
  id: string;
  client_id: string;
  type: 'Meeting' | 'Call' | 'Email' | 'Deliverable Review' | 'Feedback' | 'Complaint' | 'Quarterly Business Review';
  title: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'concerned' | 'escalated';
  recorded_by_name: string;
  action_items?: string[];
  follow_up_date?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'deadline_overdue' | 'invoice_overdue' | 'proposal_decision' | 'approval_needed' | 'client_risk' | 'system';
  urgency: 'high' | 'medium' | 'low';
  link_url: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  actor_name: string;
  actor_role: string;
  action_type:
    | 'lead_created'
    | 'lead_stage_updated'
    | 'proposal_sent'
    | 'proposal_accepted'
    | 'proposal_rejected'
    | 'proposal_value_changed'
    | 'project_created'
    | 'deliverable_submitted'
    | 'deliverable_approved'
    | 'deliverable_revision_requested'
    | 'invoice_created'
    | 'payment_received'
    | 'client_created'
    | 'client_owner_reassigned'
    | 'client_status_changed'
    | 'client_closure_recorded'
    | 'expense_logged';
  entity_type: 'client' | 'lead' | 'proposal' | 'project' | 'deliverable' | 'invoice' | 'expense';
  entity_id: string;
  entity_name: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface OperationalSummary {
  proposals_awaiting: number;
  deliverables_overdue: number;
  payments_due_this_week: number;
  at_risk_clients_count: number;
  unassigned_tasks_count: number;
}

export interface BusinessPulseMetrics {
  active_clients: number;
  new_clients_this_month: number;
  mrr: number;
  total_revenue_collected: number;
  invoiced_revenue: number;
  outstanding_receivables: number;
  estimated_operating_profit: number;
  operating_profit_margin: number;
  proposal_conversion_rate: number;
  client_retention_rate: number;
  timeframe: '7d' | '30d' | '90d' | 'custom';
}
