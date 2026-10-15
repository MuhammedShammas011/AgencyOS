'use client';

import React from 'react';
import Link from 'next/link';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { isPastDate, formatCurrency, formatDate } from '@/lib/utils';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  DollarSign,
  UserX
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OperationalRadar() {
  const { deliverables, proposals, invoices, clients, tasks } = useAgencyStore();

  // 1. Overdue Deliverables
  const overdueDeliverables = deliverables
    .filter((d) => d.status !== 'approved' && d.status !== 'cancelled' && isPastDate(d.due_date))
    .map((d) => ({
      id: d.id,
      title: d.title,
      entity: d.client_name,
      detail: `Due ${formatDate(d.due_date)} • Owner: ${d.assigned_owner_name}`,
      urgency: 'high' as const,
      category: 'Deliverable Overdue',
      link: '/delivery',
      icon: Layers,
    }));

  // 2. Overdue Invoices
  const overdueInvoices = invoices
    .filter((inv) => (inv.status === 'overdue' || inv.status === 'partially_paid') && inv.outstanding_amount > 0 && isPastDate(inv.due_date))
    .map((inv) => ({
      id: inv.id,
      title: `${inv.invoice_number} (${formatCurrency(inv.outstanding_amount)} outstanding)`,
      entity: inv.client_name,
      detail: `Due ${formatDate(inv.due_date)} • ${inv.status.replace('_', ' ')}`,
      urgency: 'high' as const,
      category: 'Overdue Receivable',
      link: '/financials',
      icon: DollarSign,
    }));

  // 3. Clients at Risk
  const atRiskClients = clients
    .filter((c) => c.status === 'at_risk')
    .map((c) => ({
      id: c.id,
      title: `Client relationship health at ${c.health_score}%`,
      entity: c.name,
      detail: c.next_action || 'Executive alignment required',
      urgency: 'high' as const,
      category: 'Client At Risk',
      link: `/clients/${c.id}`,
      icon: ShieldAlert,
    }));

  // 4. Proposals requiring follow-up
  const pendingProposals = proposals
    .filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'negotiation')
    .map((p) => ({
      id: p.id,
      title: `${p.proposal_number} — ${formatCurrency(p.total_quoted_value)}`,
      entity: p.client_name,
      detail: `Decision target: ${p.expected_decision_date ? formatDate(p.expected_decision_date) : 'Pending'} • Status: ${p.status.toUpperCase()}`,
      urgency: 'medium' as const,
      category: 'Proposal Follow-up',
      link: '/proposals',
      icon: FileSpreadsheet,
    }));

  // 5. Tasks without assigned owner
  const unassignedTasks = tasks
    .filter((t) => !t.assigned_to_id || t.assigned_to_id === '')
    .map((t) => ({
      id: t.id,
      title: t.title,
      entity: t.project_name || 'Creative Sprint',
      detail: `Priority: ${t.priority.toUpperCase()}`,
      urgency: 'low' as const,
      category: 'Unassigned Task',
      link: '/delivery',
      icon: UserX,
    }));

  const allItems = [
    ...overdueDeliverables,
    ...overdueInvoices,
    ...atRiskClients,
    ...pendingProposals,
    ...unassignedTasks,
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight flex items-center gap-2">
            <span>Operational Radar: Needs Attention</span>
            {allItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FFEBEA] text-[#E5484D] text-[10px] font-mono font-bold flex items-center justify-center">
                {allItems.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-[#777777]">
            Urgent bottlenecks, delivery roadblocks, and revenue risks grouped by urgency
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase text-[#777777] bg-[#F7F6F2] px-2 py-1 rounded border border-[#E6E4DE]">
          Live Database Triggers
        </span>
      </div>

      <div className="divide-y divide-[#E6E4DE] max-h-96 overflow-y-auto">
        {allItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777777]">
            All studio operations nominal. Zero critical bottlenecks.
          </div>
        ) : (
          allItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.link}
                className="flex items-start justify-between py-3 px-2 rounded-lg hover:bg-[#F7F6F2] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-md shrink-0 mt-0.5 ${
                      item.urgency === 'high'
                        ? 'bg-[#FFEBEA] text-[#E5484D]'
                        : item.urgency === 'medium'
                        ? 'bg-[#FFF8E6] text-[#B7791F]'
                        : 'bg-[#F2EFE9] text-[#777777]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[#171717] group-hover:text-black">
                        {item.title}
                      </span>
                      <Badge
                        variant={
                          item.urgency === 'high'
                            ? 'destructive'
                            : item.urgency === 'medium'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {item.category}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-medium text-[#171717]">
                      {item.entity}
                    </div>
                    <div className="text-[10px] text-[#777777] mt-0.5">
                      {item.detail}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-medium text-[#777777] group-hover:text-[#171717] shrink-0 pt-1">
                  <span className="hidden sm:inline">Resolve</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
