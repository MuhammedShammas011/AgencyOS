'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ProposalFormModal } from '@/components/proposals/proposal-form-modal';
import { ProposalDetailDrawer } from '@/components/proposals/proposal-detail-drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Proposal } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, FileSpreadsheet, ArrowUpRight, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

export default function ProposalsPage() {
  const { proposals } = useAgencyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const filteredProposals = proposals.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.proposal_number.toLowerCase().includes(q) ||
      p.client_name.toLowerCase().includes(q) ||
      p.company.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPipelineQuoted = proposals
    .filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'negotiation')
    .reduce((acc, p) => acc + p.total_quoted_value, 0);

  const acceptedValue = proposals
    .filter((p) => p.status === 'accepted')
    .reduce((acc, p) => acc + p.total_quoted_value, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Commercial Intelligence
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">{proposals.length} Proposals Authored</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Proposals & Revenue Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Structure itemized scopes, discount tiers, and convert accepted quotes into studio delivery projects.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="chartreuse"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-1.5 shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Generate Proposal</span>
            </Button>
          </div>
        </div>

        {/* Pulse Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Quotes Under Decision</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {formatCurrency(totalPipelineQuoted)}
              </div>
            </div>
            <Clock className="w-5 h-5 text-[#B7791F]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Accepted Won Value</div>
              <div className="text-lg font-bold font-editorial-mono text-[#30A46C] mt-0.5">
                {formatCurrency(acceptedValue)}
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-[#30A46C]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Conversion Success</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {Math.round((proposals.filter((p) => p.status === 'accepted').length / (proposals.length || 1)) * 100)}%
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-[#171717]" />
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] w-full sm:max-w-md">
            <Search className="w-4 h-4 text-[#777777] shrink-0" />
            <input
              type="text"
              placeholder="Search by proposal # or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-[#171717] placeholder:text-[#999999]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-[#171717] outline-none self-end sm:self-auto"
          >
            <option value="all">All Proposal Statuses</option>
            <option value="sent">Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="accepted">Accepted</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Proposals Table */}
        <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
              <tr>
                <th className="px-4 py-3">Proposal #</th>
                <th className="px-4 py-3">Client & Entity</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Scope Items</th>
                <th className="px-4 py-3 text-right">Quoted Value</th>
                <th className="px-4 py-3">Sales Owner</th>
                <th className="px-4 py-3">Decision Target</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E4DE]">
              {filteredProposals.map((p) => {
                const isAccepted = p.status === 'accepted';
                const isRejected = p.status === 'rejected';

                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProposal(p)}
                    className="hover:bg-[#F7F6F2] transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-[#171717]">
                      {p.proposal_number}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#171717]">{p.client_name}</div>
                      <div className="text-[11px] text-[#777777]">{p.company}</div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline">v{p.version}</Badge>
                    </td>

                    <td className="px-4 py-3 text-[#555555]">
                      {p.items.length} line item{p.items.length === 1 ? '' : 's'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-[#171717]">
                      {formatCurrency(p.total_quoted_value)}
                    </td>

                    <td className="px-4 py-3 text-[#555555]">{p.sales_owner_name}</td>

                    <td className="px-4 py-3 text-[#777777] font-mono">
                      {formatDate(p.expected_decision_date)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Badge
                        variant={
                          isAccepted
                            ? 'success'
                            : isRejected
                            ? 'destructive'
                            : p.status === 'negotiation'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {p.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProposal(p);
                        }}
                        className="p-1 rounded text-[#777777] hover:text-[#171717] hover:bg-[#EFECE5]"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals & Drawers */}
      <ProposalFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <ProposalDetailDrawer
        proposal={selectedProposal}
        onClose={() => setSelectedProposal(null)}
      />
    </AppShell>
  );
}
