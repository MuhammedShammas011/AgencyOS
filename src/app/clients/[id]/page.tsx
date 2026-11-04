'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, isPastDate, getTodayDateString } from '@/lib/utils';
import { ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { Client, WorkStatus, ServiceType } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_OPTIONS: string[] = [
  'Brand Identity & Strategy',
  'Rebranding',
  'UI/UX Design',
  'Logo Design',
  'Graphic & Motion Design',
  'Social Media Management',
  'Content Creation',
  'Video Production',
  'Website & App Development',
  'Performance Marketing & SEO',
  'Commercial Photography',
  'Influencer & PR Campaigns',
];

const WORK_STATUSES: { value: WorkStatus; label: string; color: string; dot: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'review', label: 'In Review', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
];

// ─── Payment status helper ────────────────────────────────────────────────────

function getPaymentStatus(client: Client): 'paid' | 'pending' | 'overdue' {
  const agreedAmount = client.agreed_amount ?? client.project_value ?? 0;
  const paid = client.total_paid ?? 0;
  if (paid >= agreedAmount && agreedAmount > 0) return 'paid';
  if (client.payment_due_date && isPastDate(client.payment_due_date)) return 'overdue';
  return 'pending';
}

const paymentStatusConfig = {
  paid: { label: 'Paid', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  pending: { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  overdue: { label: 'Overdue', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-sm text-gray-400">Loading...</div>}>
      <ClientDetailContent params={params} />
    </React.Suspense>
  );
}

function ClientDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();

  const { clients, clientPayments, clientWorkItems, addClientPayment, updateClient, addClientWorkItem, updateClientWorkItem, deleteClientWorkItem } = useAgencyStore();

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
  const [editingWorkItemId, setEditingWorkItemId] = useState<string | null>(null);

  // Payment form
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(getTodayDateString());
  const [payNote, setPayNote] = useState('');

  // Work item form
  const [workTitle, setWorkTitle] = useState('');
  const [workService, setWorkService] = useState(SERVICE_OPTIONS[0]);
  const [workStatus, setWorkStatus] = useState<WorkStatus>('not_started');
  const [workProgress, setWorkProgress] = useState(0);
  const [workNotes, setWorkNotes] = useState('');

  const client = clients.find((c) => c.id === clientId);
  const payments = clientPayments
    .filter((p) => p.client_id === clientId)
    .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  const workItems = clientWorkItems
    .filter((w) => w.client_id === clientId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (!client) {
    return (
      <AppShell>
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm">Client not found.</p>
          <Link href="/clients" className="text-sm text-gray-900 underline mt-3 inline-block">Back to clients</Link>
        </div>
      </AppShell>
    );
  }

  const agreedAmount = client.agreed_amount ?? client.project_value ?? 0;
  const totalPaid = client.total_paid ?? 0;
  const remaining = Math.max(0, agreedAmount - totalPaid);
  const payStatus = getPaymentStatus(client);
  const cfg = paymentStatusConfig[payStatus];

  // Work progress summary
  const completedCount = workItems.filter((w) => w.status === 'completed').length;
  const overallProgress = workItems.length > 0
    ? Math.round(workItems.reduce((sum, w) => sum + w.progress, 0) / workItems.length)
    : 0;

  // ── Handlers ────────────────────────────────────

  const handleAddPayment = () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    addClientPayment(client.id, { amount, payment_date: payDate, note: payNote || undefined });
    setPayAmount(''); setPayDate(getTodayDateString()); setPayNote('');
    setIsPaymentModalOpen(false);
  };

  const openAddWork = () => {
    setWorkTitle(''); setWorkService(SERVICE_OPTIONS[0]);
    setWorkStatus('not_started'); setWorkProgress(0); setWorkNotes('');
    setEditingWorkItemId(null);
    setIsAddWorkModalOpen(true);
  };

  const openEditWork = (id: string) => {
    const item = workItems.find((w) => w.id === id);
    if (!item) return;
    setWorkTitle(item.title); setWorkService(item.service);
    setWorkStatus(item.status); setWorkProgress(item.progress); setWorkNotes(item.notes || '');
    setEditingWorkItemId(id);
    setIsAddWorkModalOpen(true);
  };

  const handleSaveWork = () => {
    if (!workTitle.trim()) return;
    if (editingWorkItemId) {
      updateClientWorkItem(editingWorkItemId, { title: workTitle, service: workService, status: workStatus, progress: workProgress, notes: workNotes || undefined });
    } else {
      addClientWorkItem(client.id, { title: workTitle, service: workService, status: workStatus, progress: workProgress, notes: workNotes || undefined });
    }
    setIsAddWorkModalOpen(false);
  };

  const handleDelete = () => {
    updateClient(client.id, { status: 'lost' });
    router.push('/clients');
  };

  // ── Render ────────────────────────────────────

  return (
    <AppShell>
      {/* Back Link */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4 sm:mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </Link>

      {/* Page Header (Responsive wrapping) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-100 flex items-center justify-center text-base sm:text-lg font-semibold text-gray-700 shrink-0">
            {client.company.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{client.company}</h1>
            <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-400">{client.name}</span>
              {(client.services || []).map((svc) => (
                <span key={svc} className="px-2 py-0.5 text-[11px] sm:text-xs bg-gray-100 text-gray-600 rounded-md truncate max-w-[150px]">{svc}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

        {/* ── Left Column ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Client Information */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 sm:mb-4">Client Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 sm:gap-y-4 gap-x-6">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Company Name</div>
                <div className="text-sm text-gray-900 font-medium">{client.company}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Contact Person</div>
                <div className="text-sm text-gray-900 font-medium">{client.name}</div>
              </div>
              {client.phone && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Phone</div>
                  <div className="text-sm text-gray-900">{client.phone}</div>
                </div>
              )}
              {client.email && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Email</div>
                  <div className="text-sm text-gray-900 break-all">{client.email}</div>
                </div>
              )}
            </div>
          </div>

          {/* Client Handler */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 sm:mb-4">Client Handler</h2>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                {(client.account_manager_name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-sm text-gray-900 font-medium">{client.account_manager_name || 'Unassigned'}</div>
            </div>
          </div>

          {/* Work & Progress */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Work & Progress</h2>
                {workItems.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">{completedCount}/{workItems.length} completed · {overallProgress}% overall</p>
                )}
              </div>
              <button
                onClick={openAddWork}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Work
              </button>
            </div>

            {workItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No work items yet.{' '}
                <button onClick={openAddWork} className="underline text-gray-600 hover:text-gray-900 cursor-pointer">Add one</button>
              </div>
            ) : (
              <div className="space-y-3">
                {workItems.map((item) => {
                  const statusCfg = WORK_STATUSES.find((s) => s.value === item.status) ?? WORK_STATUSES[0];
                  return (
                    <div key={item.id} className="border border-gray-100 rounded-xl p-3.5 sm:p-4 group hover:border-gray-200 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{item.title}</span>
                            <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{item.service}</span>
                          </div>
                          {item.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-medium border ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {statusCfg.label}
                          </span>
                          {/* Visible on mobile touchscreens without hover */}
                          <button
                            onClick={() => openEditWork(item.id)}
                            className="p-1 text-gray-400 hover:text-gray-700 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            title="Edit work item"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteClientWorkItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                            title="Delete work item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.status === 'completed' ? 'bg-green-500' :
                              item.status === 'in_progress' ? 'bg-blue-500' :
                              item.status === 'review' ? 'bg-amber-400' : 'bg-gray-300'
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment Details</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4 sm:gap-x-6">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Agreed Amount</div>
                <div className="text-sm text-gray-900 font-semibold">{formatCurrency(agreedAmount)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Total Received</div>
                <div className="text-sm text-green-700 font-semibold">{formatCurrency(totalPaid)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Remaining Balance</div>
                <div className={`text-sm font-semibold ${remaining > 0 ? 'text-red-600' : 'text-gray-500'}`}>{formatCurrency(remaining)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Last Payment</div>
                <div className="text-sm text-gray-900">{formatDate(client.last_payment_date) || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Payment Due Date</div>
                <div className={`text-sm font-medium ${payStatus === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(client.payment_due_date) || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Payment History</h2>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Payment
              </button>
            </div>
            {payments.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">No payments recorded yet.</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 pr-3">
                      <div className="text-sm text-gray-900 font-medium">{formatCurrency(p.amount)}</div>
                      {p.note && <div className="text-xs text-gray-400 mt-0.5 truncate">{p.note}</div>}
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">{formatDate(p.payment_date)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column – Summary ──────────────────── */}
        <div className="space-y-5">

          {/* Payment summary */}
          <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Payment Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Agreed</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(agreedAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Received</span>
                <span className="text-sm font-semibold text-green-700">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-xs text-gray-500">Balance</span>
                <span className={`text-sm font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatCurrency(remaining)}</span>
              </div>
              {agreedAmount > 0 && (
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Collected</span>
                    <span>{Math.min(100, Math.round((totalPaid / agreedAmount) * 100))}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(100, (totalPaid / agreedAmount) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full mt-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
            >
              + Add Payment
            </button>
          </div>

          {/* Work summary */}
          {workItems.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Work Summary</h2>
              <div className="space-y-2">
                {WORK_STATUSES.filter((s) => workItems.some((w) => w.status === s.value)).map((s) => {
                  const count = workItems.filter((w) => w.status === s.value).length;
                  return (
                    <div key={s.value} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="text-xs text-gray-600">{s.label}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{count}</span>
                    </div>
                  );
                })}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Overall progress</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Services list */}
          {(client.services || []).length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 sm:p-5 shadow-2xs">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Services</h2>
              <div className="flex flex-wrap gap-1.5">
                {(client.services || []).map((svc) => (
                  <span key={svc} className="px-2.5 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-100 rounded-lg">{svc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────── */}

      {/* Edit Client */}
      <ClientFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} client={client} />

      {/* Add Payment */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Add Payment" description={`Record a payment from ${client.company}`} maxWidth="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Date *</label>
            <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Note (optional)</label>
            <input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g. First installment"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleAddPayment} disabled={!payAmount || parseFloat(payAmount) <= 0}>Record Payment</Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit Work Item */}
      <Modal
        isOpen={isAddWorkModalOpen}
        onClose={() => setIsAddWorkModalOpen(false)}
        title={editingWorkItemId ? 'Edit Work Item' : 'Add Work Item'}
        description="Track a piece of work for this client."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" value={workTitle} onChange={(e) => setWorkTitle(e.target.value)} placeholder="e.g. Logo Redesign"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Service Type</label>
            <select value={workService} onChange={(e) => setWorkService(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors">
              {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={workStatus} onChange={(e) => setWorkStatus(e.target.value as WorkStatus)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors">
                {WORK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Progress: {workProgress}%</label>
              <input type="range" min={0} max={100} value={workProgress} onChange={(e) => setWorkProgress(Number(e.target.value))}
                className="w-full accent-gray-900 mt-2" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input type="text" value={workNotes} onChange={(e) => setWorkNotes(e.target.value)} placeholder="Any extra details..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors" />
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100">
            <Button variant="secondary" size="sm" onClick={() => setIsAddWorkModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSaveWork} disabled={!workTitle.trim()}>
              {editingWorkItemId ? 'Save Changes' : 'Add Work Item'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Remove Client" description="This will mark the client as lost. Are you sure?" maxWidth="sm">
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>Remove Client</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
