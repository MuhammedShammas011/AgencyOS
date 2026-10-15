'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Client,
  Lead,
  Proposal,
  Project,
  Task,
  Deliverable,
  Invoice,
  Expense,
  ClientClosureRecord,
  ClientInteraction,
  ActivityLog,
  NotificationItem,
  UserProfile,
  UserRole,
  OperationalSummary,
  BusinessPulseMetrics,
  LeadPipelineStage,
  ProposalStatus,
  DeliverableStatus,
  TaskStatus,
  PaymentTransaction
} from '@/lib/types';
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
} from '@/lib/data/initial-data';
import { isPastDate, generateId } from '@/lib/utils';
import { toast } from 'sonner';

interface AgencyStoreContextType {
  // State
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  timeframe: '7d' | '30d' | '90d' | 'custom';
  setTimeframe: (tf: '7d' | '30d' | '90d' | 'custom') => void;
  
  users: UserProfile[];
  clients: Client[];
  leads: Lead[];
  proposals: Proposal[];
  projects: Project[];
  tasks: Task[];
  deliverables: Deliverable[];
  invoices: Invoice[];
  expenses: Expense[];
  clientClosures: ClientClosureRecord[];
  interactions: ClientInteraction[];
  activityLogs: ActivityLog[];
  notifications: NotificationItem[];
  unreadNotificationCount: number;

  // Computed live metrics
  operationalSummary: OperationalSummary;
  businessPulse: BusinessPulseMetrics;

  // Actions
  addClient: (client: Partial<Client>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  closeClient: (closureData: Omit<ClientClosureRecord, 'id' | 'created_at'>) => void;
  
  addLead: (lead: Partial<Lead>) => Lead;
  updateLeadStage: (id: string, newStage: LeadPipelineStage, notes?: string) => void;
  convertLeadToClient: (leadId: string) => Client | null;

  createProposal: (proposal: Partial<Proposal>) => Proposal;
  updateProposalStatus: (id: string, status: ProposalStatus, feedback?: string) => void;
  convertProposalToProject: (proposalId: string) => Project | null;

  addProject: (project: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;

  addDeliverable: (deliv: Partial<Deliverable>) => Deliverable;
  updateDeliverableStatus: (id: string, status: DeliverableStatus, notes?: string) => void;
  submitDeliverableVersion: (id: string, fileUrl: string, reviewNotes?: string) => void;

  addTask: (task: Partial<Task>) => Task;
  updateTaskStatus: (id: string, status: TaskStatus) => void;

  createInvoice: (invoice: Partial<Invoice>) => Invoice;
  recordPayment: (invoiceId: string, payment: Omit<PaymentTransaction, 'id' | 'created_at'>) => void;

  addExpense: (expense: Partial<Expense>) => Expense;
  addClientInteraction: (interaction: Partial<ClientInteraction>) => void;

  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDefaultData: () => void;
}

const AgencyStoreContext = createContext<AgencyStoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'agency_os_store_v3';

export function AgencyStoreProvider({ children }: { children: ReactNode }) {
  // Current user role simulator
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // State slices
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(INITIAL_DELIVERABLES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [clientClosures, setClientClosures] = useState<ClientClosureRecord[]>(INITIAL_CLIENT_CLOSURES);
  const [interactions, setInteractions] = useState<ClientInteraction[]>(INITIAL_INTERACTIONS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Restore from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.clients) setClients(parsed.clients);
        if (parsed.leads) setLeads(parsed.leads);
        if (parsed.proposals) setProposals(parsed.proposals);
        if (parsed.projects) setProjects(parsed.projects);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.deliverables) setDeliverables(parsed.deliverables);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.clientClosures) setClientClosures(parsed.clientClosures);
        if (parsed.interactions) setInteractions(parsed.interactions);
        if (parsed.activityLogs) setActivityLogs(parsed.activityLogs);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.currentRole) setCurrentRole(parsed.currentRole);
      }
    } catch {
      // Ignore parse errors and use initial data
    }
  }, []);

  // Save to localStorage on state changes
  useEffect(() => {
    try {
      const dataToSave = {
        clients,
        leads,
        proposals,
        projects,
        tasks,
        deliverables,
        invoices,
        expenses,
        clientClosures,
        interactions,
        activityLogs,
        notifications,
        currentRole,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // Storage might be full or restricted
    }
  }, [clients, leads, proposals, projects, tasks, deliverables, invoices, expenses, clientClosures, interactions, activityLogs, notifications, currentRole]);

  // Current active user based on simulated role
  const currentUser = useMemo(() => {
    const found = users.find((u) => u.role === currentRole);
    return found || users[0];
  }, [users, currentRole]);

  // Dynamic Operational Summary calculation (strictly computed, never hardcoded!)
  const operationalSummary = useMemo<OperationalSummary>(() => {
    const proposalsAwaiting = proposals.filter((p) => p.status === 'sent' || p.status === 'negotiation' || p.status === 'viewed').length;
    
    const deliverablesOverdue = deliverables.filter((d) => {
      return d.status !== 'approved' && d.status !== 'cancelled' && isPastDate(d.due_date);
    }).length;

    // Payments due in current 7 days or overdue
    const today = typeof window !== 'undefined' ? new Date() : new Date('2026-10-15T12:00:00Z');
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    const paymentsDue = invoices
      .filter((inv) => (inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'overdue'))
      .reduce((acc, inv) => acc + inv.outstanding_amount, 0);

    const atRiskClients = clients.filter((c) => c.status === 'at_risk').length;
    const unassignedTasks = tasks.filter((t) => !t.assigned_to_id || t.assigned_to_id === '').length;

    return {
      proposals_awaiting: proposalsAwaiting,
      deliverables_overdue: deliverablesOverdue,
      payments_due_this_week: paymentsDue,
      at_risk_clients_count: atRiskClients,
      unassigned_tasks_count: unassignedTasks,
    };
  }, [proposals, deliverables, invoices, clients, tasks]);

  // Dynamic Business Pulse metrics
  const businessPulse = useMemo<BusinessPulseMetrics>(() => {
    const activeClientsList = clients.filter((c) => c.status === 'active' || c.status === 'onboarding');
    const activeClients = activeClientsList.length;
    
    // New clients this month (start date within current month)
    const now = typeof window !== 'undefined' ? new Date() : new Date('2026-10-15T12:00:00Z');
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const newClientsThisMonth = clients.filter((c) => {
      const d = new Date(c.contract_start_date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;

    // Monthly recurring revenue (sum of monthly_retainer for active clients)
    const mrr = activeClientsList.reduce((acc, c) => acc + (c.monthly_retainer || 0), 0);

    // Invoiced and Cash collected from Invoices
    const invoicedRevenue = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const totalRevenueCollected = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
    const outstandingReceivables = invoices.reduce((acc, inv) => acc + inv.outstanding_amount, 0);

    // Expenses total
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const estimatedOperatingProfit = totalRevenueCollected - totalExpenses;
    const operatingProfitMargin = totalRevenueCollected > 0 
      ? Math.round((estimatedOperatingProfit / totalRevenueCollected) * 100) 
      : 0;

    // Proposal conversion rate (accepted / total decided proposals)
    const decidedProposals = proposals.filter((p) => p.status === 'accepted' || p.status === 'rejected');
    const acceptedProposals = proposals.filter((p) => p.status === 'accepted');
    const proposalConversionRate = decidedProposals.length > 0
      ? Math.round((acceptedProposals.length / decidedProposals.length) * 100)
      : 75; // Baseline if no decisions yet

    // Client Retention Rate (Active / (Active + Lost))
    const totalLifetimeClients = clients.length + clientClosures.length;
    const lostClientsCount = clients.filter((c) => c.status === 'lost').length + clientClosures.length;
    const clientRetentionRate = totalLifetimeClients > 0
      ? Math.round(((totalLifetimeClients - lostClientsCount) / totalLifetimeClients) * 100)
      : 86;

    return {
      active_clients: activeClients,
      new_clients_this_month: newClientsThisMonth,
      mrr,
      total_revenue_collected: totalRevenueCollected,
      invoiced_revenue: invoicedRevenue,
      outstanding_receivables: outstandingReceivables,
      estimated_operating_profit: estimatedOperatingProfit,
      operating_profit_margin: operatingProfitMargin,
      proposal_conversion_rate: proposalConversionRate,
      client_retention_rate: clientRetentionRate,
      timeframe,
    };
  }, [clients, invoices, expenses, proposals, clientClosures, timeframe]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Helper to record an activity log
  const logActivity = (
    actionType: ActivityLog['action_type'],
    entityType: ActivityLog['entity_type'],
    entityId: string,
    entityName: string,
    description: string
  ) => {
    const newLog: ActivityLog = {
      id: generateId('act'),
      actor_name: currentUser.name,
      actor_role: currentUser.title,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      description,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // CLIENT ACTIONS
  const addClient = (clientData: Partial<Client>): Client => {
    const newClient: Client = {
      id: generateId('client'),
      name: clientData.name || 'Untitled Client',
      company: clientData.company || clientData.name || 'Untitled Co',
      industry: clientData.industry || 'Creative Agency',
      status: clientData.status || 'onboarding',
      health_score: clientData.health_score ?? 90,
      account_manager_id: clientData.account_manager_id || currentUser.id,
      account_manager_name: clientData.account_manager_name || currentUser.name,
      services: clientData.services || ['Brand Identity & Strategy'],
      acquisition_source_id: clientData.acquisition_source_id || 'source_direct',
      acquisition_source_name: clientData.acquisition_source_name || 'Direct Outreach',
      referring_person: clientData.referring_person,
      sales_owner_name: clientData.sales_owner_name || clientData.referring_person,
      sales_owner_id: clientData.sales_owner_id,
      monthly_retainer: clientData.monthly_retainer || 0,
      project_value: clientData.project_value || 0,
      total_invoiced: 0,
      total_paid: 0,
      outstanding_balance: 0,
      lifetime_value: (clientData.monthly_retainer ? clientData.monthly_retainer * 12 : 0) + (clientData.project_value || 0),
      contract_start_date: clientData.contract_start_date || new Date().toISOString().split('T')[0],
      contract_end_date: clientData.contract_end_date,
      next_action: clientData.next_action || 'Kick-off onboarding sprint',
      next_action_due: clientData.next_action_due,
      website: clientData.website,
      internal_notes: clientData.internal_notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev]);
    logActivity('client_created', 'client', newClient.id, newClient.name, `Onboarded new client "${newClient.name}"`);
    toast.success(`Client "${newClient.name}" created successfully`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          // Check if ownership changed
          if (updates.account_manager_id && updates.account_manager_id !== c.account_manager_id) {
            logActivity(
              'client_owner_reassigned',
              'client',
              c.id,
              c.name,
              `Reassigned account manager to ${updates.account_manager_name || updates.account_manager_id}`
            );
          }
          return { ...c, ...updates, updated_at: new Date().toISOString() };
        }
        return c;
      })
    );
    toast.success('Client updated');
  };

  const closeClient = (closureData: Omit<ClientClosureRecord, 'id' | 'created_at'>) => {
    const record: ClientClosureRecord = {
      ...closureData,
      id: generateId('close'),
      created_at: new Date().toISOString(),
    };

    setClientClosures((prev) => [record, ...prev]);

    // Mark client as lost in clients list
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === closureData.client_id) {
          return {
            ...c,
            status: 'lost',
            health_score: 10,
            updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    logActivity(
      'client_closure_recorded',
      'client',
      closureData.client_id,
      closureData.client_name,
      `Recorded structured closure for "${closureData.client_name}": ${closureData.primary_loss_reason}`
    );

    toast.info(`Client closure recorded for "${closureData.client_name}"`);
  };

  // LEAD ACTIONS
  const addLead = (leadData: Partial<Lead>): Lead => {
    const newLead: Lead = {
      id: generateId('lead'),
      name: leadData.name || 'New Prospect',
      company: leadData.company || 'Unknown Co',
      email: leadData.email || '',
      phone: leadData.phone,
      industry: leadData.industry,
      acquisition_source: leadData.acquisition_source || 'Website',
      referring_person: leadData.referring_person,
      lead_owner_id: leadData.lead_owner_id || currentUser.id,
      lead_owner_name: leadData.lead_owner_name || currentUser.name,
      estimated_deal_value: leadData.estimated_deal_value || 0,
      deal_type: leadData.deal_type || 'retainer',
      stage: leadData.stage || 'new',
      confidence_level: leadData.confidence_level || 'medium',
      next_follow_up: leadData.next_follow_up,
      notes: leadData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setLeads((prev) => [newLead, ...prev]);
    logActivity('lead_created', 'lead', newLead.id, newLead.company, `Added lead for ${newLead.company}`);
    toast.success(`Lead for "${newLead.company}" created`);
    return newLead;
  };

  const updateLeadStage = (id: string, newStage: LeadPipelineStage, notes?: string) => {
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const oldStage = l.stage;
          logActivity(
            'lead_stage_updated',
            'lead',
            l.id,
            l.company,
            `Moved lead "${l.company}" from ${oldStage.toUpperCase()} to ${newStage.toUpperCase()}`
          );
          return {
            ...l,
            stage: newStage,
            notes: notes ? `${l.notes ? l.notes + '\n' : ''}${notes}` : l.notes,
            updated_at: new Date().toISOString(),
          };
        }
        return l;
      })
    );
    toast.success(`Pipeline updated to ${newStage}`);
  };

  const convertLeadToClient = (leadId: string): Client | null => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;

    const newClient = addClient({
      name: lead.name,
      company: lead.company,
      industry: lead.industry || 'Creative Agency',
      acquisition_source_name: lead.acquisition_source,
      referring_person: lead.referring_person,
      monthly_retainer: lead.deal_type === 'retainer' ? lead.estimated_deal_value : 0,
      project_value: lead.deal_type === 'project' ? lead.estimated_deal_value : 0,
      sales_owner_id: lead.lead_owner_id,
    });

    // Mark lead as won
    updateLeadStage(leadId, 'won', `Converted to client: ${newClient.name}`);
    return newClient;
  };

  // PROPOSAL ACTIONS
  const createProposal = (propData: Partial<Proposal>): Proposal => {
    const items = propData.items || [];
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const discountRate = propData.discount_rate || 0;
    const discountAmount = Math.round((subtotal * discountRate) / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxRate = propData.tax_rate ?? 18;
    const taxAmount = Math.round((taxableAmount * taxRate) / 100);
    const totalQuotedValue = taxableAmount + taxAmount;

    const newProp: Proposal = {
      id: generateId('prop'),
      proposal_number: `PROP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: propData.client_id,
      client_name: propData.client_name || 'Client',
      company: propData.company || propData.client_name || 'Company',
      lead_id: propData.lead_id,
      sales_owner_id: propData.sales_owner_id || currentUser.id,
      sales_owner_name: propData.sales_owner_name || currentUser.name,
      version: 1,
      status: propData.status || 'draft',
      items,
      subtotal,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_quoted_value: totalQuotedValue,
      currency: propData.currency || 'INR',
      valid_until: propData.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      expected_decision_date: propData.expected_decision_date,
      versions: [
        {
          version: 1,
          created_at: new Date().toISOString(),
          created_by_name: currentUser.name,
          quoted_value: totalQuotedValue,
          changes_summary: 'Initial proposal draft',
        },
      ],
      notes: propData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProposals((prev) => [newProp, ...prev]);
    logActivity('proposal_sent', 'proposal', newProp.id, newProp.proposal_number, `Created proposal ${newProp.proposal_number} for ${newProp.client_name}`);
    toast.success(`Proposal ${newProp.proposal_number} generated`);
    return newProp;
  };

  const updateProposalStatus = (id: string, status: ProposalStatus, feedback?: string) => {
    setProposals((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const action = status === 'accepted' ? 'proposal_accepted' : status === 'rejected' ? 'proposal_rejected' : 'proposal_value_changed';
          logActivity(action, 'proposal', p.id, p.proposal_number, `Proposal ${p.proposal_number} marked as ${status.toUpperCase()}`);
          return {
            ...p,
            status,
            client_feedback: feedback || p.client_feedback,
            accepted_date: status === 'accepted' ? new Date().toISOString().split('T')[0] : p.accepted_date,
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    toast.success(`Proposal marked as ${status}`);
  };

  const convertProposalToProject = (proposalId: string): Project | null => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return null;

    // Build project from proposal
    const newProject = addProject({
      name: `${proposal.client_name} Execution Sprint`,
      client_id: proposal.client_id || generateId('client'),
      client_name: proposal.client_name,
      proposal_id: proposal.id,
      budget: proposal.subtotal,
      contracted_scope: proposal.items.map((i) => `• ${i.description} (${i.service_category})`).join('\n'),
      services: Array.from(new Set(proposal.items.map((i) => i.service_category))),
      start_date: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    });

    // Automatically generate first deliverable from proposal items!
    if (proposal.items.length > 0) {
      addDeliverable({
        title: proposal.items[0].description,
        project_id: newProject.id,
        project_name: newProject.name,
        client_id: newProject.client_id,
        client_name: newProject.client_name,
        due_date: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      });
    }

    // Link proposal
    setProposals((prev) =>
      prev.map((p) => (p.id === proposalId ? { ...p, resulting_project_id: newProject.id, status: 'accepted' } : p))
    );

    toast.success(`Project "${newProject.name}" created from proposal!`);
    return newProject;
  };

  // PROJECT ACTIONS
  const addProject = (projData: Partial<Project>): Project => {
    const newProject: Project = {
      id: generateId('proj'),
      name: projData.name || 'Untitled Creative Project',
      client_id: projData.client_id || '',
      client_name: projData.client_name || 'Client',
      proposal_id: projData.proposal_id,
      project_owner_id: projData.project_owner_id || currentUser.id,
      project_owner_name: projData.project_owner_name || currentUser.name,
      account_manager_id: projData.account_manager_id || currentUser.id,
      account_manager_name: projData.account_manager_name || currentUser.name,
      team_member_ids: projData.team_member_ids || [currentUser.id],
      status: projData.status || 'in_progress',
      progress_percent: projData.progress_percent || 10,
      budget: projData.budget || 0,
      spent_amount: projData.spent_amount || 0,
      services: projData.services || ['Brand Identity & Strategy'],
      contracted_scope: projData.contracted_scope || 'Standard creative deliverables sprint.',
      start_date: projData.start_date || new Date().toISOString().split('T')[0],
      deadline: projData.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProjects((prev) => [newProject, ...prev]);
    logActivity('project_created', 'project', newProject.id, newProject.name, `Created project "${newProject.name}"`);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
    toast.success('Project updated');
  };

  // DELIVERABLE ACTIONS
  const addDeliverable = (delivData: Partial<Deliverable>): Deliverable => {
    const newDeliv: Deliverable = {
      id: generateId('deliv'),
      title: delivData.title || 'Master Creative Asset',
      deliverable_type: delivData.deliverable_type || 'Brand Identity Book',
      project_id: delivData.project_id || '',
      project_name: delivData.project_name || '',
      client_id: delivData.client_id || '',
      client_name: delivData.client_name || '',
      assigned_owner_id: delivData.assigned_owner_id || currentUser.id,
      assigned_owner_name: delivData.assigned_owner_name || currentUser.name,
      due_date: delivData.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: delivData.status || 'not_started',
      current_version: 1,
      file_or_preview_url: delivData.file_or_preview_url,
      internal_review_status: 'pending',
      client_approval_status: 'pending',
      revision_count: 0,
      versions: [],
      notes: delivData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDeliverables((prev) => [newDeliv, ...prev]);
    toast.success(`Deliverable "${newDeliv.title}" added`);
    return newDeliv;
  };

  const updateDeliverableStatus = (id: string, status: DeliverableStatus, notes?: string) => {
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const isApproved = status === 'approved';
          const isRevision = status === 'revision_requested';
          const newRevisionCount = isRevision ? d.revision_count + 1 : d.revision_count;

          const action = isApproved ? 'deliverable_approved' : isRevision ? 'deliverable_revision_requested' : 'deliverable_submitted';
          logActivity(action, 'deliverable', d.id, d.title, `Deliverable "${d.title}" status changed to ${status}`);

          return {
            ...d,
            status,
            revision_count: newRevisionCount,
            approved_at: isApproved ? new Date().toISOString() : d.approved_at,
            client_approval_status: isApproved ? 'approved' : isRevision ? 'revision_requested' : d.client_approval_status,
            notes: notes ? `${d.notes ? d.notes + '\n' : ''}${notes}` : d.notes,
            updated_at: new Date().toISOString(),
          };
        }
        return d;
      })
    );
    toast.success(`Deliverable status updated to ${status}`);
  };

  const submitDeliverableVersion = (id: string, fileUrl: string, reviewNotes?: string) => {
    setDeliverables((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextVersion = d.current_version + 1;
          const newVersionRecord = {
            version: nextVersion,
            file_url: fileUrl,
            submitted_at: new Date().toISOString(),
            submitted_by_name: currentUser.name,
            review_notes: reviewNotes,
          };

          logActivity(
            'deliverable_submitted',
            'deliverable',
            d.id,
            d.title,
            `Uploaded version ${nextVersion} preview for "${d.title}"`
          );

          return {
            ...d,
            current_version: nextVersion,
            file_or_preview_url: fileUrl,
            status: 'internal_review',
            internal_review_status: 'pending',
            latest_submission_date: new Date().toISOString(),
            versions: [newVersionRecord, ...d.versions],
            updated_at: new Date().toISOString(),
          };
        }
        return d;
      })
    );
    toast.success('New deliverable version uploaded for review');
  };

  // TASK ACTIONS
  const addTask = (taskData: Partial<Task>): Task => {
    const newTask: Task = {
      id: generateId('task'),
      project_id: taskData.project_id || '',
      project_name: taskData.project_name,
      client_id: taskData.client_id,
      client_name: taskData.client_name,
      deliverable_id: taskData.deliverable_id,
      title: taskData.title || 'Untitled Task',
      description: taskData.description,
      assigned_to_id: taskData.assigned_to_id || currentUser.id,
      assigned_to_name: taskData.assigned_to_name || currentUser.name,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      estimated_hours: taskData.estimated_hours || 4,
      actual_hours: taskData.actual_hours || 0,
      due_date: taskData.due_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    toast.success('Task created');
    return newTask;
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status, completed_at: status === 'done' ? new Date().toISOString() : undefined, updated_at: new Date().toISOString() } : t))
    );
    toast.success(`Task moved to ${status}`);
  };

  // FINANCIAL ACTIONS
  const createInvoice = (invData: Partial<Invoice>): Invoice => {
    const items = invData.items || [];
    const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
    const taxRate = invData.tax_rate ?? 18;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalAmount = subtotal + taxAmount;

    const newInv: Invoice = {
      id: generateId('inv'),
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: invData.client_id || '',
      client_name: invData.client_name || 'Client',
      project_id: invData.project_id,
      project_name: invData.project_name,
      issue_date: invData.issue_date || new Date().toISOString().split('T')[0],
      due_date: invData.due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      amount_paid: 0,
      outstanding_amount: totalAmount,
      status: invData.status || 'sent',
      payment_terms: invData.payment_terms || 'Net 15',
      payments: [],
      notes: invData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setInvoices((prev) => [newInv, ...prev]);
    
    // Update client total_invoiced and outstanding_balance
    if (newInv.client_id) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === newInv.client_id
            ? {
                ...c,
                total_invoiced: c.total_invoiced + newInv.total_amount,
                outstanding_balance: c.outstanding_balance + newInv.total_amount,
                updated_at: new Date().toISOString(),
              }
            : c
        )
      );
    }

    logActivity('invoice_created', 'invoice', newInv.id, newInv.invoice_number, `Generated invoice ${newInv.invoice_number} for ${newInv.client_name}`);
    toast.success(`Invoice ${newInv.invoice_number} created`);
    return newInv;
  };

  const recordPayment = (invoiceId: string, paymentData: Omit<PaymentTransaction, 'id' | 'created_at'>) => {
    const paymentRecord: PaymentTransaction = {
      ...paymentData,
      id: generateId('pay'),
      invoice_id: invoiceId,
      created_at: new Date().toISOString(),
    };

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newAmountPaid = inv.amount_paid + paymentData.amount;
          const newOutstanding = Math.max(0, inv.total_amount - newAmountPaid);
          const newStatus = newOutstanding === 0 ? 'paid' : 'partially_paid';

          // Update client balances
          if (inv.client_id) {
            setClients((clientPrev) =>
              clientPrev.map((c) =>
                c.id === inv.client_id
                  ? {
                      ...c,
                      total_paid: c.total_paid + paymentData.amount,
                      outstanding_balance: Math.max(0, c.outstanding_balance - paymentData.amount),
                      updated_at: new Date().toISOString(),
                    }
                  : c
              )
            );
          }

          logActivity(
            'payment_received',
            'invoice',
            inv.id,
            inv.invoice_number,
            `Recorded payment of ₹${paymentData.amount.toLocaleString()} on ${inv.invoice_number} via ${paymentData.payment_method}`
          );

          return {
            ...inv,
            amount_paid: newAmountPaid,
            outstanding_amount: newOutstanding,
            status: newStatus,
            payments: [paymentRecord, ...inv.payments],
            updated_at: new Date().toISOString(),
          };
        }
        return inv;
      })
    );

    toast.success(`Payment of ₹${paymentData.amount.toLocaleString()} recorded successfully!`);
  };

  const addExpense = (expData: Partial<Expense>): Expense => {
    const newExp: Expense = {
      id: generateId('exp'),
      title: expData.title || 'Agency Operational Expense',
      category: expData.category || 'Software & AI Tools',
      vendor: expData.vendor || 'Vendor',
      amount: expData.amount || 0,
      tax_amount: expData.tax_amount || 0,
      expense_date: expData.expense_date || new Date().toISOString().split('T')[0],
      payment_status: expData.payment_status || 'paid',
      client_id: expData.client_id,
      client_name: expData.client_name,
      project_id: expData.project_id,
      notes: expData.notes,
      created_at: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);
    logActivity('expense_logged', 'expense', newExp.id, newExp.title, `Logged expense ₹${newExp.amount.toLocaleString()} for ${newExp.vendor}`);
    toast.success('Expense recorded');
    return newExp;
  };

  const addClientInteraction = (interData: Partial<ClientInteraction>) => {
    const newInteraction: ClientInteraction = {
      id: generateId('inter'),
      client_id: interData.client_id || '',
      type: interData.type || 'Meeting',
      title: interData.title || 'Client Discussion',
      summary: interData.summary || '',
      sentiment: interData.sentiment || 'neutral',
      recorded_by_name: currentUser.name,
      action_items: interData.action_items || [],
      follow_up_date: interData.follow_up_date,
      created_at: new Date().toISOString(),
    };

    setInteractions((prev) => [newInteraction, ...prev]);
    toast.success('Interaction logged');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.info('All notifications marked as read');
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setClients(INITIAL_CLIENTS);
    setLeads(INITIAL_LEADS);
    setProposals(INITIAL_PROPOSALS);
    setProjects(INITIAL_PROJECTS);
    setTasks(INITIAL_TASKS);
    setDeliverables(INITIAL_DELIVERABLES);
    setInvoices(INITIAL_INVOICES);
    setExpenses(INITIAL_EXPENSES);
    setClientClosures(INITIAL_CLIENT_CLOSURES);
    setInteractions(INITIAL_INTERACTIONS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    toast.success('Agency OS reset to curated baseline dataset');
  };

  return (
    <AgencyStoreContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        timeframe,
        setTimeframe,
        users,
        clients,
        leads,
        proposals,
        projects,
        tasks,
        deliverables,
        invoices,
        expenses,
        clientClosures,
        interactions,
        activityLogs,
        notifications,
        unreadNotificationCount,
        operationalSummary,
        businessPulse,
        addClient,
        updateClient,
        closeClient,
        addLead,
        updateLeadStage,
        convertLeadToClient,
        createProposal,
        updateProposalStatus,
        convertProposalToProject,
        addProject,
        updateProject,
        addDeliverable,
        updateDeliverableStatus,
        submitDeliverableVersion,
        addTask,
        updateTaskStatus,
        createInvoice,
        recordPayment,
        addExpense,
        addClientInteraction,
        markNotificationRead,
        clearAllNotifications,
        resetToDefaultData,
      }}
    >
      {children}
    </AgencyStoreContext.Provider>
  );
}

export function useAgencyStore() {
  const context = useContext(AgencyStoreContext);
  if (!context) {
    throw new Error('useAgencyStore must be used within an AgencyStoreProvider');
  }
  return context;
}
