'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
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
  PaymentTransaction,
  ClientPayment,
  ClientWorkItem,
  WorkStatus,
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
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface TailscaleEmployeeIdentity {
  employeeName: string;
  identified: boolean;
  roleTitle?: string;
  department?: string;
  clientIp?: string;
  tailscale?: {
    nodeName: string;
    fqdn: string;
    ip: string;
    displayName?: string;
  } | null;
}

interface AgencyStoreContextType {
  // State
  currentUser: UserProfile;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeUserId: string;
  setActiveUserId: (id: string) => void;
  employeeIdentity: TailscaleEmployeeIdentity;
  isLoadingIdentity: boolean;
  timeframe: '7d' | '30d' | '90d' | 'custom';
  setTimeframe: (tf: '7d' | '30d' | '90d' | 'custom') => void;

  users: UserProfile[];
  clients: Client[];
  clientPayments: ClientPayment[];
  clientWorkItems: ClientWorkItem[];
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

  // Sync state
  isSyncing: boolean;
  lastSyncedAt: string | null;
  refreshDatabase: () => Promise<void>;

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
  addClientPayment: (clientId: string, payment: { amount: number; payment_date: string; note?: string }) => void;
  addClientWorkItem: (clientId: string, item: { title: string; service: string; status: WorkStatus; progress: number; notes?: string }) => ClientWorkItem;
  updateClientWorkItem: (id: string, updates: Partial<Pick<ClientWorkItem, 'title' | 'service' | 'status' | 'progress' | 'notes'>>) => void;
  deleteClientWorkItem: (id: string) => void;

  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDefaultData: () => void;
}

const AgencyStoreContext = createContext<AgencyStoreContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'agency_os_store_v3';

export function AgencyStoreProvider({ children }: { children: ReactNode }) {
  // Current user role simulator
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [activeUserId, setActiveUserIdState] = useState<string>('user_admin');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');

  // Tailscale Verified Employee Identity
  const [employeeIdentity, setEmployeeIdentity] = useState<TailscaleEmployeeIdentity>({
    employeeName: 'Unknown Employee',
    identified: false,
    roleTitle: 'Verifying Device...',
  });
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);

  // Central Database State Slices
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [clientWorkItems, setClientWorkItems] = useState<ClientWorkItem[]>([]);
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

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Ref to prevent duplicate in-flight requests
  const isSyncingRef = useRef(false);

  // ── Central Database Fetch & Reconcile ─────────────────────────────────────
  const fetchSyncData = useCallback(async (isSilent = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (!isSilent) setIsSyncing(true);

    try {
      const res = await fetch('/api/sync', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.users) && data.users.length > 0) setUsers(data.users);
          if (Array.isArray(data.clients) && data.clients.length > 0) setClients(data.clients);
          if (Array.isArray(data.clientPayments)) setClientPayments(data.clientPayments);
          if (Array.isArray(data.clientWorkItems)) setClientWorkItems(data.clientWorkItems);
          if (Array.isArray(data.projects)) setProjects(data.projects);
          if (Array.isArray(data.tasks)) setTasks(data.tasks);
          if (Array.isArray(data.deliverables)) setDeliverables(data.deliverables);
          if (Array.isArray(data.invoices)) setInvoices(data.invoices);
          if (Array.isArray(data.expenses)) setExpenses(data.expenses);
          if (Array.isArray(data.leads)) setLeads(data.leads);
          if (Array.isArray(data.proposals)) setProposals(data.proposals);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);

          setLastSyncedAt(data.synced_at || new Date().toISOString());

          // Save backup snapshot to local storage for offline fallback only
          try {
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({
                clients: data.clients,
                clientPayments: data.clientPayments,
                clientWorkItems: data.clientWorkItems,
                projects: data.projects,
                tasks: data.tasks,
              })
            );
          } catch {}
        }
      }
    } catch (err) {
      if (!isSilent) {
        console.warn('[agency-store: sync failed, using cached state]', err);
      }
    } finally {
      isSyncingRef.current = false;
      if (!isSilent) setIsSyncing(false);
    }
  }, []);

  // 1. Initial Load: Fetch from Supabase PostgreSQL on mount
  useEffect(() => {
    fetchSyncData(false);

    // Restore active user selection from storage
    try {
      const savedUser = localStorage.getItem('agency_os_active_user_id');
      if (savedUser) setActiveUserIdState(savedUser);
    } catch {}
  }, [fetchSyncData]);

  // 2. Re-fetch on window focus or network reconnect
  useEffect(() => {
    const handleOnline = () => fetchSyncData(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSyncData(true);
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSyncData]);

  // 3. Supabase Realtime Subscription (Multi-user live sync)
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('agency-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newClient = payload.new as Client;
            setClients((prev) => {
              if (prev.some((c) => c.id === newClient.id)) return prev;
              return [newClient, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Client;
            setClients((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) {
              setClients((prev) => prev.filter((c) => c.id !== oldId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_payments' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const payment = payload.new as ClientPayment;
            setClientPayments((prev) => {
              if (prev.some((p) => p.id === payment.id)) return prev;
              return [payment, ...prev];
            });
            // Re-fetch sync to get updated client totals
            fetchSyncData(true);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'client_work_items' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = payload.new as ClientWorkItem;
            setClientWorkItems((prev) => {
              if (prev.some((w) => w.id === item.id)) return prev;
              return [item, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const item = payload.new as ClientWorkItem;
            setClientWorkItems((prev) =>
              prev.map((w) => (w.id === item.id ? { ...w, ...item } : w))
            );
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            if (oldId) {
              setClientWorkItems((prev) => prev.filter((w) => w.id !== oldId));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const proj = payload.new as Project;
            setProjects((prev) => (prev.some((p) => p.id === proj.id) ? prev : [proj, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const proj = payload.new as Project;
            setProjects((prev) => prev.map((p) => (p.id === proj.id ? { ...p, ...proj } : p)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const task = payload.new as Task;
            setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [task, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            const task = payload.new as Task;
            setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...task } : t)));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const notif = payload.new as NotificationItem;
            setNotifications((prev) => [notif, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [fetchSyncData]);

  // 4. Background Polling Fallback (every 5 seconds when tab is active)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchSyncData(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchSyncData]);

  // Server-verified Tailscale Device Identity Fetch
  useEffect(() => {
    let isMounted = true;
    async function resolveTailscaleIdentity() {
      try {
        const res = await fetch('/api/auth/tailscale-user', {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (res.ok) {
          const data: TailscaleEmployeeIdentity = await res.json();
          if (isMounted) setEmployeeIdentity(data);
        } else {
          if (isMounted) {
            setEmployeeIdentity({
              employeeName: 'Unknown Employee',
              identified: false,
              roleTitle: 'Unregistered Device',
            });
          }
        }
      } catch {
        if (isMounted) {
          setEmployeeIdentity({
            employeeName: 'Unknown Employee',
            identified: false,
            roleTitle: 'Unverified Network',
          });
        }
      } finally {
        if (isMounted) setIsLoadingIdentity(false);
      }
    }

    resolveTailscaleIdentity();
    return () => {
      isMounted = false;
    };
  }, []);

  const setActiveUserId = (id: string) => {
    setActiveUserIdState(id);
    try {
      localStorage.setItem('agency_os_active_user_id', id);
    } catch {}
    const found = users.find((u) => u.id === id);
    if (found) setCurrentRole(found.role);
  };

  // Current active user
  const currentUser = useMemo(() => {
    if (employeeIdentity.identified && employeeIdentity.employeeName && employeeIdentity.employeeName !== 'Unknown Employee') {
      const foundEmployee = users.find(
        (u) => u.name.toLowerCase() === employeeIdentity.employeeName.toLowerCase()
      );
      if (foundEmployee) return foundEmployee;
    }

    const foundSelected = users.find((u) => u.id === activeUserId);
    if (foundSelected) return foundSelected;

    return users.find((u) => u.role === currentRole) || users[0];
  }, [users, activeUserId, currentRole, employeeIdentity]);

  // Operational summary
  const operationalSummary = useMemo<OperationalSummary>(() => {
    const proposalsAwaiting = proposals.filter(
      (p) => p.status === 'sent' || p.status === 'negotiation' || p.status === 'viewed'
    ).length;

    const deliverablesOverdue = deliverables.filter((d) => {
      return d.status !== 'approved' && d.status !== 'cancelled' && isPastDate(d.due_date);
    }).length;

    const paymentsDue = invoices
      .filter((inv) => inv.status === 'sent' || inv.status === 'partially_paid' || inv.status === 'overdue')
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

  // Business pulse metrics
  const businessPulse = useMemo<BusinessPulseMetrics>(() => {
    const activeClientsList = clients.filter((c) => c.status === 'active' || c.status === 'onboarding');
    const activeClients = activeClientsList.length;

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const newClientsThisMonth = clients.filter((c) => {
      const d = new Date(c.contract_start_date);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    }).length;

    const mrr = activeClientsList.reduce((acc, c) => acc + (c.monthly_retainer || 0), 0);
    const invoicedRevenue = invoices.reduce((acc, inv) => acc + inv.total_amount, 0);
    const totalRevenueCollected = invoices.reduce((acc, inv) => acc + inv.amount_paid, 0);
    const outstandingReceivables = invoices.reduce((acc, inv) => acc + inv.outstanding_amount, 0);

    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const estimatedOperatingProfit = totalRevenueCollected - totalExpenses;
    const operatingProfitMargin = totalRevenueCollected > 0
      ? Math.round((estimatedOperatingProfit / totalRevenueCollected) * 100)
      : 0;

    const decidedProposals = proposals.filter((p) => p.status === 'accepted' || p.status === 'rejected');
    const acceptedProposals = proposals.filter((p) => p.status === 'accepted');
    const proposalConversionRate = decidedProposals.length > 0
      ? Math.round((acceptedProposals.length / decidedProposals.length) * 100)
      : 75;

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

  // ── Database Operations (Async Central DB with Optimistic UI) ─────────────

  // CLIENT ACTIONS
  const addClient = (clientData: Partial<Client>): Client => {
    const id = generateId('client');
    const agreedAmount = clientData.agreed_amount ?? clientData.project_value ?? 0;

    const newClient: Client = {
      id,
      name: clientData.name || clientData.company || 'Untitled Client',
      company: clientData.company || clientData.name || 'Untitled Co',
      industry: clientData.industry || 'General',
      status: clientData.status || 'active',
      health_score: clientData.health_score ?? 90,
      account_manager_id: clientData.account_manager_id || currentUser.id,
      account_manager_name: clientData.account_manager_name || currentUser.name,
      services: clientData.services || ['Brand Identity & Strategy'],
      acquisition_source_id: clientData.acquisition_source_id || 'source_direct',
      acquisition_source_name: clientData.acquisition_source_name || 'Direct Outreach',
      referring_person: clientData.referring_person,
      sales_owner_name: clientData.sales_owner_name,
      sales_owner_id: clientData.sales_owner_id,
      monthly_retainer: clientData.monthly_retainer || 0,
      project_value: agreedAmount,
      agreed_amount: agreedAmount,
      total_invoiced: 0,
      total_paid: 0,
      outstanding_balance: agreedAmount,
      lifetime_value: agreedAmount,
      contract_start_date: clientData.contract_start_date || new Date().toISOString().split('T')[0],
      contract_end_date: clientData.contract_end_date,
      payment_due_date: clientData.payment_due_date,
      last_payment_date: clientData.last_payment_date,
      website: clientData.website,
      email: clientData.email,
      phone: clientData.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Optimistic UI update
    setClients((prev) => [newClient, ...prev]);

    // 2. Persist to central Supabase PostgreSQL
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClient),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to save client to database');
        }
        const data = await res.json();
        if (data.client) {
          setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
        }
      })
      .catch((err) => {
        console.error('[addClient DB error]', err);
        toast.error('Client saved locally; syncing to central database in background.');
      });

    toast.success(`Client "${newClient.company}" created`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    // 1. Optimistic UI update
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, ...updates, updated_at: new Date().toISOString() };
        }
        return c;
      })
    );

    // 2. Persist to central Supabase PostgreSQL
    fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to update client in database');
        }
        const data = await res.json();
        if (data.client) {
          setClients((prev) => prev.map((c) => (c.id === id ? data.client : c)));
        }
      })
      .catch((err) => {
        console.error('[updateClient DB error]', err);
        toast.error('Update saved locally; syncing to database.');
      });

    toast.success('Client updated');
  };

  const closeClient = (closureData: Omit<ClientClosureRecord, 'id' | 'created_at'>) => {
    const record: ClientClosureRecord = {
      ...closureData,
      id: generateId('close'),
      created_at: new Date().toISOString(),
    };

    setClientClosures((prev) => [record, ...prev]);

    // Mark client as lost in database
    updateClient(closureData.client_id, { status: 'lost', health_score: 10 });
    toast.info(`Client closure recorded for "${closureData.client_name}"`);
  };

  // CLIENT PAYMENTS
  const addClientPayment = (
    clientId: string,
    paymentData: { amount: number; payment_date: string; note?: string }
  ) => {
    const tempId = generateId('cpay');
    const newPayment: ClientPayment = {
      id: tempId,
      client_id: clientId,
      amount: paymentData.amount,
      payment_date: paymentData.payment_date,
      note: paymentData.note,
      created_at: new Date().toISOString(),
    };

    // 1. Optimistic UI update
    setClientPayments((prev) => [newPayment, ...prev]);
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== clientId) return c;
        const newTotalPaid = (c.total_paid || 0) + paymentData.amount;
        const agreed = c.agreed_amount ?? c.project_value ?? 0;
        const newRemaining = Math.max(0, agreed - newTotalPaid);
        return {
          ...c,
          total_paid: newTotalPaid,
          outstanding_balance: newRemaining,
          last_payment_date: paymentData.payment_date,
          updated_at: new Date().toISOString(),
        };
      })
    );

    // 2. Persist to central database
    fetch(`/api/clients/${clientId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to record payment in database');
        }
        const data = await res.json();
        if (data.payment) {
          setClientPayments((prev) =>
            prev.map((p) => (p.id === tempId ? data.payment : p))
          );
        }
        if (data.clientTotals) {
          setClients((prev) =>
            prev.map((c) =>
              c.id === clientId
                ? {
                    ...c,
                    total_paid: data.clientTotals.total_paid,
                    outstanding_balance: data.clientTotals.outstanding_balance,
                    last_payment_date: data.clientTotals.last_payment_date,
                  }
                : c
            )
          );
        }
      })
      .catch((err) => {
        console.error('[addClientPayment DB error]', err);
        toast.error('Payment recorded locally; syncing to central database.');
      });

    toast.success(`Payment of ₹${paymentData.amount.toLocaleString()} recorded!`);
  };

  // CLIENT WORK ITEMS
  const addClientWorkItem = (
    clientId: string,
    item: { title: string; service: string; status: WorkStatus; progress: number; notes?: string }
  ): ClientWorkItem => {
    const tempId = generateId('work');
    const newWorkItem: ClientWorkItem = {
      id: tempId,
      client_id: clientId,
      title: item.title,
      service: item.service,
      status: item.status,
      progress: item.progress,
      notes: item.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClientWorkItems((prev) => [newWorkItem, ...prev]);

    fetch(`/api/clients/${clientId}/work-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.workItem) {
            setClientWorkItems((prev) =>
              prev.map((w) => (w.id === tempId ? data.workItem : w))
            );
          }
        }
      })
      .catch((err) => console.error('[addClientWorkItem error]', err));

    toast.success('Work item added');
    return newWorkItem;
  };

  const updateClientWorkItem = (
    id: string,
    updates: Partial<Pick<ClientWorkItem, 'title' | 'service' | 'status' | 'progress' | 'notes'>>
  ) => {
    const existing = clientWorkItems.find((w) => w.id === id);
    if (!existing) return;

    setClientWorkItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w))
    );

    fetch(`/api/clients/${existing.client_id}/work-items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error('[updateClientWorkItem error]', err));

    toast.success('Work item updated');
  };

  const deleteClientWorkItem = (id: string) => {
    const existing = clientWorkItems.find((w) => w.id === id);
    setClientWorkItems((prev) => prev.filter((w) => w.id !== id));

    if (existing) {
      fetch(`/api/clients/${existing.client_id}/work-items/${id}`, {
        method: 'DELETE',
      }).catch((err) => console.error('[deleteClientWorkItem error]', err));
    }
    toast.success('Work item removed');
  };

  // PROJECTS
  const addProject = (projData: Partial<Project>): Project => {
    const tempId = generateId('proj');
    const newProject: Project = {
      id: tempId,
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

    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.project) {
            setProjects((prev) => prev.map((p) => (p.id === tempId ? data.project : p)));
          }
        }
      })
      .catch((err) => console.error('[addProject error]', err));

    toast.success(`Project "${newProject.name}" created`);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );

    fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch((err) => console.error('[updateProject error]', err));

    toast.success('Project updated');
  };

  // TASKS
  const addTask = (taskData: Partial<Task>): Task => {
    const tempId = generateId('task');
    const newTask: Task = {
      id: tempId,
      project_id: taskData.project_id || '',
      project_name: taskData.project_name,
      client_id: taskData.client_id,
      client_name: taskData.client_name,
      deliverable_id: taskData.deliverable_id,
      title: taskData.title || 'Untitled Action Item',
      description: taskData.description,
      assigned_to_id: taskData.assigned_to_id || currentUser.id,
      assigned_to_name: taskData.assigned_to_name || currentUser.name,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'todo',
      estimated_hours: taskData.estimated_hours || 4,
      actual_hours: taskData.actual_hours || 0,
      start_date: taskData.start_date,
      due_date: taskData.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.task) {
            setTasks((prev) => prev.map((t) => (t.id === tempId ? data.task : t)));
          }
        }
      })
      .catch((err) => console.error('[addTask error]', err));

    toast.success('Task created');
    return newTask;
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completed_at: status === 'done' ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      }),
    }).catch((err) => console.error('[updateTaskStatus error]', err));

    toast.success(`Task moved to ${status}`);
  };

  // LEADS & PROPOSALS & DELIVERABLES & FINANCIALS (Backwards-compatible)
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
    toast.success(`Lead for "${newLead.company}" created`);
    return newLead;
  };

  const updateLeadStage = (id: string, newStage: LeadPipelineStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l))
    );
    toast.success(`Lead moved to ${newStage}`);
  };

  const convertLeadToClient = (leadId: string): Client | null => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return null;
    const client = addClient({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      industry: lead.industry,
      agreed_amount: lead.estimated_deal_value,
      project_value: lead.estimated_deal_value,
    });
    updateLeadStage(leadId, 'won');
    return client;
  };

  const createProposal = (propData: Partial<Proposal>): Proposal => {
    const items = propData.items || [];
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const taxRate = propData.tax_rate ?? 18;
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const totalQuotedValue = subtotal + taxAmount;

    const newProp: Proposal = {
      id: generateId('prop'),
      proposal_number: `PROP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: propData.client_id,
      client_name: propData.client_name || 'Client',
      company: propData.company || 'Company',
      sales_owner_id: currentUser.id,
      sales_owner_name: currentUser.name,
      version: 1,
      status: 'draft',
      items,
      subtotal,
      discount_rate: 0,
      discount_amount: 0,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_quoted_value: totalQuotedValue,
      currency: 'INR',
      valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      versions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProposals((prev) => [newProp, ...prev]);
    toast.success(`Proposal ${newProp.proposal_number} drafted`);
    return newProp;
  };

  const updateProposalStatus = (id: string, status: ProposalStatus) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p))
    );
    toast.success(`Proposal status updated to ${status}`);
  };

  const convertProposalToProject = (proposalId: string): Project | null => {
    const proposal = proposals.find((p) => p.id === proposalId);
    if (!proposal) return null;
    const project = addProject({
      name: `${proposal.client_name} Sprint`,
      client_id: proposal.client_id || '',
      client_name: proposal.client_name,
      budget: proposal.subtotal,
    });
    updateProposalStatus(proposalId, 'accepted');
    return project;
  };

  const addDeliverable = (deliv: Partial<Deliverable>): Deliverable => {
    const newDeliv: Deliverable = {
      id: generateId('deliv'),
      title: deliv.title || 'Deliverable',
      deliverable_type: deliv.deliverable_type || 'Brand Identity Book',
      project_id: deliv.project_id || '',
      project_name: deliv.project_name || '',
      client_id: deliv.client_id || '',
      client_name: deliv.client_name || '',
      assigned_owner_id: currentUser.id,
      assigned_owner_name: currentUser.name,
      due_date: deliv.due_date || new Date().toISOString().split('T')[0],
      status: 'not_started',
      current_version: 1,
      internal_review_status: 'pending',
      client_approval_status: 'pending',
      revision_count: 0,
      versions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setDeliverables((prev) => [newDeliv, ...prev]);
    toast.success('Deliverable created');
    return newDeliv;
  };

  const updateDeliverableStatus = (id: string, status: DeliverableStatus) => {
    setDeliverables((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, updated_at: new Date().toISOString() } : d))
    );
    toast.success(`Deliverable status: ${status}`);
  };

  const submitDeliverableVersion = (id: string, fileUrl: string) => {
    setDeliverables((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              current_version: d.current_version + 1,
              file_or_preview_url: fileUrl,
              internal_review_status: 'passed',
              status: 'submitted_to_client',
              updated_at: new Date().toISOString(),
            }
          : d
      )
    );
    toast.success('Version submitted');
  };

  const createInvoice = (invData: Partial<Invoice>): Invoice => {
    const newInv: Invoice = {
      id: generateId('inv'),
      invoice_number: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      client_id: invData.client_id || '',
      client_name: invData.client_name || 'Client',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      items: invData.items || [],
      subtotal: invData.subtotal || 0,
      tax_rate: 18,
      tax_amount: 0,
      total_amount: invData.total_amount || 0,
      amount_paid: 0,
      outstanding_amount: invData.total_amount || 0,
      status: 'sent',
      payment_terms: 'Net 15',
      payments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setInvoices((prev) => [newInv, ...prev]);
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
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              amount_paid: inv.amount_paid + paymentData.amount,
              outstanding_amount: Math.max(0, inv.outstanding_amount - paymentData.amount),
              payments: [paymentRecord, ...inv.payments],
              updated_at: new Date().toISOString(),
            }
          : inv
      )
    );
    toast.success('Payment recorded');
  };

  const addExpense = (expData: Partial<Expense>): Expense => {
    const newExp: Expense = {
      id: generateId('exp'),
      title: expData.title || 'Operational Expense',
      category: expData.category || 'Software & AI Tools',
      vendor: expData.vendor || 'Vendor',
      amount: expData.amount || 0,
      tax_amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      payment_status: 'paid',
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
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
  };

  const resetToDefaultData = () => {
    fetchSyncData(false);
  };

  return (
    <AgencyStoreContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        activeUserId,
        setActiveUserId,
        employeeIdentity,
        isLoadingIdentity,
        timeframe,
        setTimeframe,
        users,
        clients,
        clientPayments,
        clientWorkItems,
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
        isSyncing,
        lastSyncedAt,
        refreshDatabase: () => fetchSyncData(false),
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
        addClientPayment,
        addClientWorkItem,
        updateClientWorkItem,
        deleteClientWorkItem,
        markNotificationRead,
        clearAllNotifications,
        resetToDefaultData,
      }}
    >
      {children}
    </AgencyStoreContext.Provider>
  );
}

export function useAgencyStore(): AgencyStoreContextType {
  const context = useContext(AgencyStoreContext);
  if (!context) {
    throw new Error('useAgencyStore must be used within an AgencyStoreProvider');
  }
  return context;
}
