'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { DeliverableTracker } from '@/components/delivery/deliverable-tracker';
import { ProjectKanban } from '@/components/delivery/project-kanban';
import { DeliverableFormModal } from '@/components/delivery/deliverable-form-modal';
import { DeliverableReviewModal } from '@/components/delivery/deliverable-review-modal';
import { Button } from '@/components/ui/button';
import { Deliverable } from '@/lib/types';
import { isPastDate } from '@/lib/utils';
import { Plus, Layers, Columns, List, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function DeliveryPage() {
  const { deliverables, projects } = useAgencyStore();
  const [activeTab, setActiveTab] = useState<'deliverables' | 'projects' | 'overdue'>('deliverables');
  const [isAddDeliverableOpen, setIsAddDeliverableOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);

  const overdueDeliverables = deliverables.filter(
    (d) => d.status !== 'approved' && isPastDate(d.due_date)
  );
  const inReviewCount = deliverables.filter(
    (d) => d.status === 'internal_review' || d.status === 'submitted_to_client'
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Creative Production & Execution
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">{deliverables.length} Deliverables in Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Delivery Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Creative deliverables workflow. Distinctly track internal review gates, client approval sign-offs, and multi-version asset reviews.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="chartreuse"
              size="sm"
              onClick={() => setIsAddDeliverableOpen(true)}
              className="gap-1.5 shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Create Deliverable</span>
            </Button>
          </div>
        </div>

        {/* Pulse Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Overdue Deliverables</div>
              <div className="text-lg font-bold font-editorial-mono text-[#E5484D] mt-0.5">
                {overdueDeliverables.length} Critical
              </div>
            </div>
            <AlertTriangle className="w-5 h-5 text-[#E5484D]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Assets in Review Gate</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {inReviewCount} Versions
              </div>
            </div>
            <Clock className="w-5 h-5 text-[#B7791F]" />
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#777777] uppercase">Active Studio Projects</div>
              <div className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5">
                {projects.filter((p) => p.status === 'in_progress').length} In Execution
              </div>
            </div>
            <Layers className="w-5 h-5 text-[#30A46C]" />
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between p-1 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('deliverables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'deliverables'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Deliverables Tracker & Approval Gate</span>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'projects'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Projects Sprint Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'overdue'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#E5484D]" />
              <span>Overdue Work Radar ({overdueDeliverables.length})</span>
            </button>
          </div>
        </div>

        {/* Active View */}
        <div>
          {activeTab === 'deliverables' && (
            <DeliverableTracker
              deliverables={deliverables}
              onSelectDeliverable={(d) => setSelectedDeliverable(d)}
            />
          )}

          {activeTab === 'projects' && <ProjectKanban />}

          {activeTab === 'overdue' && (
            <DeliverableTracker
              deliverables={overdueDeliverables}
              onSelectDeliverable={(d) => setSelectedDeliverable(d)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <DeliverableFormModal
        isOpen={isAddDeliverableOpen}
        onClose={() => setIsAddDeliverableOpen(false)}
      />
      <DeliverableReviewModal
        deliverable={selectedDeliverable}
        onClose={() => setSelectedDeliverable(null)}
      />
    </AppShell>
  );
}
