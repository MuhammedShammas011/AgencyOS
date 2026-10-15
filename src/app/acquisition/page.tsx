'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { LeadPipelineKanban } from '@/components/acquisition/lead-pipeline-kanban';
import { AcquisitionAnalytics } from '@/components/acquisition/acquisition-analytics';
import { LeadFormModal } from '@/components/acquisition/lead-form-modal';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Plus, Target, Columns, BarChart3, TrendingUp, Users } from 'lucide-react';

export default function AcquisitionPage() {
  const { leads } = useAgencyStore();
  const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);

  const activeLeads = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
  const pipelineValue = activeLeads.reduce((acc, l) => acc + (l.estimated_deal_value || 0), 0);
  const wonValue = leads.filter((l) => l.stage === 'won').reduce((acc, l) => acc + (l.estimated_deal_value || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Inbound & Sales Pipeline
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">{activeLeads.length} Active Deals</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Acquisition Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Track how the studio wins work. Separate acquisition channels, personal referrers, and internal sales ownership.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="chartreuse"
              size="sm"
              onClick={() => setIsAddLeadModalOpen(true)}
              className="gap-1.5 shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Lead</span>
            </Button>
          </div>
        </div>

        {/* Pipeline Pulse Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Active Pipeline Value</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {formatCurrency(pipelineValue)}
              </div>
            </div>
            <TrendingUp className="w-5 h-5 text-[#171717]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Closed Won Revenue</div>
              <div className="text-lg font-bold font-editorial-mono text-[#30A46C] mt-0.5">
                {formatCurrency(wonValue)}
              </div>
            </div>
            <Target className="w-5 h-5 text-[#30A46C]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Total Inquiries Tracked</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {leads.length} Prospects
              </div>
            </div>
            <Users className="w-5 h-5 text-[#777777]" />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between p-1 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'board'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Pipeline Kanban Board</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Acquisition Analytics</span>
            </button>
          </div>
        </div>

        {/* Active Content */}
        {activeTab === 'board' ? <LeadPipelineKanban /> : <AcquisitionAnalytics />}
      </div>

      <LeadFormModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />
    </AppShell>
  );
}
