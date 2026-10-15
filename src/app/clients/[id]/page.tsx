'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ClientClosureModal } from '@/components/retention/client-closure-modal';
import {
  ArrowLeft,
  Building,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  Clock,
  ShieldAlert,
  Plus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-[#777777]">Loading client workspace...</div>}>
      <ClientProfileContent params={params} />
    </React.Suspense>
  );
}

function ClientProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clientId = resolvedParams.id;
  const router = useRouter();

  const {
    clients,
    proposals,
    projects,
    deliverables,
    invoices,
    interactions,
    activityLogs,
    addClientInteraction,
    updateClient,
    users
  } = useAgencyStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'commercials' | 'delivery' | 'relationship' | 'history'>('overview');
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Assignment states
  const [selectedWorkOwnerId, setSelectedWorkOwnerId] = useState('');
  const [selectedBroughtBy, setSelectedBroughtBy] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // New interaction form state
  const [newInteractionType, setNewInteractionType] = useState<'Meeting' | 'Call' | 'Email' | 'Deliverable Review' | 'Feedback' | 'Complaint'>('Meeting');
  const [newInteractionTitle, setNewInteractionTitle] = useState('');
  const [newInteractionSummary, setNewInteractionSummary] = useState('');
  const [newInteractionSentiment, setNewInteractionSentiment] = useState<'positive' | 'neutral' | 'concerned' | 'escalated'>('neutral');

  const client = clients.find((c) => c.id === clientId);

  useEffect(() => {
    if (client) {
      setSelectedWorkOwnerId(client.account_manager_id);
      setSelectedBroughtBy(client.sales_owner_name || client.referring_person || 'Shahil Mohammed');
    }
  }, [client]);

  if (!client) {
    return (
      <AppShell>
        <div className="py-24 text-center">
          <h2 className="text-lg font-semibold text-[#171717]">Client record not found</h2>
          <p className="text-xs text-[#777777] mt-1">The requested client workspace may have been archived.</p>
          <Button variant="secondary" size="sm" onClick={() => router.push('/clients')} className="mt-4">
            Return to Client Universe
          </Button>
        </div>
      </AppShell>
    );
  }

  // Linked records
  const clientProposals = proposals.filter((p) => p.client_id === client.id || p.client_name === client.name);
  const clientProjects = projects.filter((pr) => pr.client_id === client.id);
  const clientDeliverables = deliverables.filter((d) => d.client_id === client.id || d.client_name === client.name);
  const clientInvoices = invoices.filter((i) => i.client_id === client.id || i.client_name === client.name);
  const clientInteractions = interactions.filter((inter) => inter.client_id === client.id);
  const clientLogs = activityLogs.filter((log) => log.entity_id === client.id || log.entity_name === client.name);

  const handleSaveAssignment = () => {
    const chosenUser = users.find((u) => u.id === selectedWorkOwnerId);
    const chosenOwner = users.find((u) => u.name === selectedBroughtBy);

    updateClient(client.id, {
      account_manager_id: selectedWorkOwnerId,
      account_manager_name: chosenUser ? chosenUser.name : client.account_manager_name,
      sales_owner_name: selectedBroughtBy,
      referring_person: selectedBroughtBy,
      sales_owner_id: chosenOwner ? chosenOwner.id : undefined,
    });

    setIsAssignModalOpen(false);
  };

  const handleCreateInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionTitle || !newInteractionSummary) return;

    addClientInteraction({
      client_id: client.id,
      type: newInteractionType,
      title: newInteractionTitle,
      summary: newInteractionSummary,
      sentiment: newInteractionSentiment,
    });

    setNewInteractionTitle('');
    setNewInteractionSummary('');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-1.5 text-xs text-[#777777] hover:text-[#171717] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Client Universe
        </Link>

        {/* Identity Workspace Header */}
        <div className="p-6 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase tracking-wider text-[#777777]">
                  {client.industry}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E6E4DE]" />
                <Badge
                  variant={
                    client.status === 'active'
                      ? 'success'
                      : client.status === 'at_risk'
                      ? 'warning'
                      : client.status === 'onboarding'
                      ? 'chartreuse'
                      : 'destructive'
                  }
                >
                  {client.status.toUpperCase()}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight">
                {client.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#777777] mt-0.5">{client.company}</p>
            </div>

            {/* Quick Actions & Status Triggers */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(true)}
                className="gap-1.5 text-xs bg-[#1C1C1A] text-[#D7FF64] border-[#2A2A28] hover:bg-[#2A2A28] cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Assign Work & Attribution
              </Button>

              {client.status !== 'lost' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsClosureModalOpen(true)}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Mark as Lost (Exit Protocol)
                </Button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#E6E4DE] text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Relationship Health</span>
              <span className="text-base font-bold text-[#171717]">{client.health_score} / 100</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Work Responsibility</span>
              <span className="text-sm font-semibold text-[#171717] truncate block">
                {client.account_manager_name || 'Unassigned'}
              </span>
              <span className="text-[10px] text-[#777777] block">
                {client.account_manager_name === 'Shammas'
                  ? 'Web Dev & Production'
                  : client.account_manager_name === 'Shadin'
                  ? 'Branding & Design'
                  : 'Studio Lead'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Brought By (Lead Acquirer)</span>
              <span className="text-sm font-semibold text-[#171717] truncate block">
                {client.sales_owner_name || client.referring_person || 'Direct'}
              </span>
              <span className="text-[10px] text-[#777777] block">Lead Attribution</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Outstanding Balance</span>
              <span className={`text-base font-bold ${client.outstanding_balance > 0 ? 'text-[#E5484D]' : 'text-[#30A46C]'}`}>
                {formatCurrency(client.outstanding_balance)}
              </span>
            </div>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-1 border-t border-[#E6E4DE] pt-3 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview & Vitals' },
              { id: 'commercials', label: `Commercials (${clientProposals.length} Proposals, ${clientInvoices.length} Invoices)` },
              { id: 'delivery', label: `Delivery Studio (${clientDeliverables.length} Deliverables)` },
              { id: 'relationship', label: `Relationship & Feedback (${clientInteractions.length})` },
              { id: 'history', label: `Ownership & History (${clientLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                    : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              {/* Strategic Summary */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Client Operational Scope & Agreement
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {client.services.map((s, idx) => (
                    <Badge key={idx} variant="default">
                      {s}
                    </Badge>
                  ))}
                </div>
                {client.internal_notes && (
                  <p className="text-xs text-[#444444] bg-[#F7F6F2] p-3 rounded-lg border border-[#E6E4DE] leading-relaxed">
                    <strong>Internal Studio Directive:</strong> {client.internal_notes}
                  </p>
                )}
              </div>

              {/* Next Operational Action */}
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                    Immediate Actionable Step
                  </h3>
                  {client.next_action_due && (
                    <span className="text-[11px] font-mono text-[#E5484D]">
                      Due by: {formatDate(client.next_action_due)}
                    </span>
                  )}
                </div>
                <div className="text-sm font-semibold text-[#171717]">{client.next_action || 'No pending action.'}</div>
              </div>
            </div>

            {/* Sidebar Vitals */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3 text-xs">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Relationship Parameters
                </h3>
                <div className="divide-y divide-[#E6E4DE] space-y-2 pt-1 font-mono">
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-[#777777]">Acquisition Source:</span>
                    <span className="font-semibold text-[#171717]">{client.acquisition_source_name || 'Direct'}</span>
                  </div>
                  {client.referring_person && (
                    <div className="flex justify-between py-1 text-[11px]">
                      <span className="text-[#777777]">Referred By:</span>
                      <span className="font-semibold text-[#171717]">{client.referring_person}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-[#777777]">Contract Start:</span>
                    <span>{formatDate(client.contract_start_date)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-[#777777]">Contract End:</span>
                    <span>{formatDate(client.contract_end_date)}</span>
                  </div>
                  <div className="flex justify-between py-1 text-[11px]">
                    <span className="text-[#777777]">Website:</span>
                    {client.website ? (
                      <a href={client.website} target="_blank" rel="noreferrer" className="text-[#171717] underline truncate max-w-[150px]">
                        {client.website}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMERCIALS */}
        {activeTab === 'commercials' && (
          <div className="space-y-6">
            {/* Proposals */}
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Commercial Proposals ({clientProposals.length})
                </h3>
                <Link href="/proposals" className="text-xs font-medium text-[#171717] underline">
                  View Proposal Pipeline →
                </Link>
              </div>

              {clientProposals.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#777777]">No proposals recorded.</div>
              ) : (
                <div className="space-y-2">
                  {clientProposals.map((p) => (
                    <div key={p.id} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#171717]">{p.proposal_number} — Version {p.version}</div>
                        <div className="text-[11px] text-[#777777]">Valid until {formatDate(p.valid_until)} • Owner: {p.sales_owner_name}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-bold text-[#171717]">{formatCurrency(p.total_quoted_value)}</span>
                        <Badge variant={p.status === 'accepted' ? 'success' : 'default'}>{p.status.toUpperCase()}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoices & Payments */}
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                Invoices & Payment Transactions ({clientInvoices.length})
              </h3>
              {clientInvoices.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#777777]">No invoices generated yet.</div>
              ) : (
                <div className="divide-y divide-[#E6E4DE]">
                  {clientInvoices.map((inv) => (
                    <div key={inv.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#171717]">{inv.invoice_number}</div>
                        <div className="text-[11px] text-[#777777]">
                          Issued: {formatDate(inv.issue_date)} • Due: {formatDate(inv.due_date)} • {inv.payment_terms}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <div className="text-xs font-mono font-bold text-[#171717]">{formatCurrency(inv.total_amount)}</div>
                          <div className="text-[10px] font-mono text-[#777777]">Paid: {formatCurrency(inv.amount_paid)}</div>
                        </div>
                        <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'partially_paid' ? 'warning' : 'default'}>
                          {inv.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: DELIVERY */}
        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Active Projects & Creative Deliverables ({clientDeliverables.length})
                </h3>
                <Link href="/delivery" className="text-xs font-medium text-[#171717] underline">
                  Open Delivery Studio →
                </Link>
              </div>

              {clientDeliverables.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#777777]">No deliverables assigned to this client.</div>
              ) : (
                <div className="space-y-3">
                  {clientDeliverables.map((deliv) => (
                    <div key={deliv.id} className="p-3.5 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-[#171717]">{deliv.title}</div>
                        <div className="text-[11px] text-[#777777]">
                          Category: {deliv.deliverable_type} • Lead: {deliv.assigned_owner_name} • Due: {formatDate(deliv.due_date)}
                        </div>
                        {deliv.file_or_preview_url && (
                          <a
                            href={deliv.file_or_preview_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-[#171717] underline font-mono mt-1 inline-block"
                          >
                            Preview Asset Link ↗
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{deliv.current_version}</Badge>
                        <Badge
                          variant={
                            deliv.status === 'approved'
                              ? 'success'
                              : deliv.status === 'revision_requested'
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {deliv.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RELATIONSHIP */}
        {activeTab === 'relationship' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Client Communication Log & Feedback
                </h3>
                {clientInteractions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#777777]">
                    No interaction notes recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clientInteractions.map((inter) => (
                      <div key={inter.id} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#171717]">{inter.title}</span>
                          <span className="text-[10px] font-mono text-[#777777]">{formatDate(inter.created_at)}</span>
                        </div>
                        <div className="text-[10px] font-mono text-[#555555]">
                          Type: {inter.type} • Logged by: {inter.recorded_by_name} • Sentiment: {inter.sentiment}
                        </div>
                        <p className="text-xs text-[#333333] leading-relaxed">{inter.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Log Interaction Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleCreateInteraction} className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
                  Record Meeting / Feedback
                </h3>
                <div>
                  <label className="block text-[11px] font-semibold text-[#171717] mb-1">Interaction Type</label>
                  <select
                    value={newInteractionType}
                    onChange={(e) => setNewInteractionType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  >
                    <option value="Meeting">Meeting / Call</option>
                    <option value="Deliverable Review">Deliverable Review</option>
                    <option value="Feedback">Positive Feedback</option>
                    <option value="Complaint">Complaint / Escalation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#171717] mb-1">Topic / Subject</label>
                  <input
                    required
                    value={newInteractionTitle}
                    onChange={(e) => setNewInteractionTitle(e.target.value)}
                    placeholder="e.g. Q4 Packaging Review"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#171717] mb-1">Summary & Action Items</label>
                  <textarea
                    required
                    rows={3}
                    value={newInteractionSummary}
                    onChange={(e) => setNewInteractionSummary(e.target.value)}
                    placeholder="Key decisions, client sentiment, promised follow-up date..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  />
                </div>

                <Button variant="chartreuse" size="sm" type="submit" className="w-full">
                  Log Relationship Event
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Client Audit Trail & Ownership Transitions
            </h3>
            {clientLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#777777]">
                No historical events recorded for this client.
              </div>
            ) : (
              <div className="space-y-3">
                {clientLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-[#171717]">{log.description}</div>
                      <div className="text-[10px] font-mono text-[#777777] mt-0.5">
                        Actor: {log.actor_name} ({log.actor_role}) • {formatDate(log.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Closure Modal */}
      <ClientClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        client={client}
      />

      {/* Admin Work Assignment & Lead Attribution Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Client Work & Lead Attribution"
        description="Admin controls to assign the execution lead responsible for delivery and track who originated the client."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Responsible Work Lead (Execution & Delivery) *
            </label>
            <select
              value={selectedWorkOwnerId}
              onChange={(e) => setSelectedWorkOwnerId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.title}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-[#777777] mt-1">
              Assign <strong>Shammas</strong> for Web Development & Production, or <strong>Shadin</strong> for Branding.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Who Brought That Client (Lead Acquirer / Attribution) *
            </label>
            <select
              value={selectedBroughtBy}
              onChange={(e) => setSelectedBroughtBy(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            >
              <option value="Shahil Mohammed">Shahil Mohammed (Business Development & Growth)</option>
              <option value="Irshad Puthiyakath">Irshad Puthiyakath (Client Acquisition & Partnerships)</option>
              <option value="Nihal">Nihal (Strategic Growth & Inbound)</option>
              <option value="Direct Inbound">Direct Inbound / Organic Referral</option>
            </select>
            <p className="text-[10px] text-[#777777] mt-1">
              Attributed sales partner who acquired this account.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Assignment & Transition Notes (Optional)
            </label>
            <textarea
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
              placeholder="e.g. Assigned to Shammas for full-stack Next.js production sprint. Brought in by Shahil."
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E6E4DE]">
            <Button variant="secondary" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="chartreuse" size="sm" onClick={handleSaveAssignment}>
              Save Work Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
