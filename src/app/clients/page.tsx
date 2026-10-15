'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ClientCards } from '@/components/clients/client-cards';
import { ClientTable } from '@/components/clients/client-table';
import { ClientLifecycleBoard } from '@/components/clients/client-lifecycle-board';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { ClientClosureModal } from '@/components/retention/client-closure-modal';
import { Button } from '@/components/ui/button';
import { Client } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Users,
  Search,
  Filter,
  LayoutGrid,
  List,
  Columns,
  Plus,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';

export default function ClientsPage() {
  const { clients, users } = useAgencyStore();
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'board'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [closureTargetClient, setClosureTargetClient] = useState<Client | null>(null);

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesOwner = ownerFilter === 'all' || c.account_manager_id === ownerFilter;

    return matchesSearch && matchesStatus && matchesOwner;
  });

  // Summary counts
  const totalRetainerMRR = clients
    .filter((c) => c.status === 'active' || c.status === 'onboarding')
    .reduce((acc, c) => acc + (c.monthly_retainer || 0), 0);

  const atRiskCount = clients.filter((c) => c.status === 'at_risk').length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Relationship Registry
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">{clients.length} Total Registered</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Client Universe
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Command individual client workspaces, contract milestones, retainer health, and deliverable commitments.
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
              <span>Onboard Client</span>
            </Button>
          </div>
        </div>

        {/* Quick Insights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Active Contracted MRR</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {formatCurrency(totalRetainerMRR)}
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-[#30A46C]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">At-Risk Clients</div>
              <div className="text-lg font-bold font-editorial-mono text-[#E5484D] mt-0.5">
                {atRiskCount} Account{atRiskCount === 1 ? '' : 's'}
              </div>
            </div>
            <ShieldAlert className="w-5 h-5 text-[#E5484D]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Average Health Score</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {Math.round(clients.reduce((acc, c) => acc + c.health_score, 0) / (clients.length || 1))}%
              </div>
            </div>
            <Users className="w-5 h-5 text-[#777777]" />
          </div>
        </div>

        {/* Search, Filter & View Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
          {/* Search Box */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#777777] shrink-0" />
            <input
              type="text"
              placeholder="Search clients by name, legal entity, or vertical..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-[#171717] placeholder:text-[#999999]"
            />
          </div>

          {/* Filters and View Mode Switcher */}
          <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-[#171717] outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="at_risk">At Risk</option>
              <option value="paused">Paused</option>
              <option value="lost">Lost</option>
            </select>

            {/* Account Owner Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] text-[#171717] outline-none"
            >
              <option value="all">All Account Owners</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* View Mode Buttons */}
            <div className="flex items-center p-0.5 bg-[#F2EFE9] rounded-lg border border-[#E6E4DE]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-2xs'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
                title="Visual Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-2xs'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
                title="Compact Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'board'
                    ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-2xs'
                    : 'text-[#777777] hover:text-[#171717]'
                }`}
                title="Lifecycle Board View"
              >
                <Columns className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active View Container */}
        <div>
          {filteredClients.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
              <Users className="w-8 h-8 text-[#999999] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-[#171717]">No clients match current filters</h3>
              <p className="text-xs text-[#777777] mt-1">Try resetting the search keyword or status filter dropdown.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <ClientCards
              clients={filteredClients}
              onOpenClosure={(c) => setClosureTargetClient(c)}
            />
          ) : viewMode === 'table' ? (
            <ClientTable
              clients={filteredClients}
              onOpenClosure={(c) => setClosureTargetClient(c)}
            />
          ) : (
            <ClientLifecycleBoard
              clients={filteredClients}
              onOpenClosure={(c) => setClosureTargetClient(c)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ClientFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <ClientClosureModal
        isOpen={Boolean(closureTargetClient)}
        onClose={() => setClosureTargetClient(null)}
        client={closureTargetClient}
      />
    </AppShell>
  );
}
