'use client';

import React, { useState } from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ChevronRight, ArrowRight, User, Eye, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export function ClientMovement() {
  const { clients, leads, proposals, clientClosures } = useAgencyStore();
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  // Groupings based on live records
  const leadsCount = leads.filter((l) => l.stage === 'new').length;
  const contactedCount = leads.filter((l) => l.stage === 'contacted' || l.stage === 'qualified' || l.stage === 'meeting').length;
  const proposalCount = proposals.filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'negotiation').length;
  const wonCount = leads.filter((l) => l.stage === 'won').length + proposals.filter((p) => p.status === 'accepted').length;
  const activeCount = clients.filter((c) => c.status === 'active' || c.status === 'onboarding').length;
  const atRiskCount = clients.filter((c) => c.status === 'at_risk').length;
  const lostCount = clients.filter((c) => c.status === 'lost').length + clientClosures.length;

  const stages = [
    { id: 'lead', name: 'Lead', count: leadsCount, desc: 'Fresh inquiries', color: '#777777', conversion: '82%' },
    { id: 'contacted', name: 'Contacted', count: contactedCount, desc: 'Meeting & discovery', color: '#777777', conversion: '64%' },
    { id: 'proposal', name: 'Proposal', count: proposalCount, desc: 'Scope under decision', color: '#171717', conversion: '75%' },
    { id: 'won', name: 'Won', count: wonCount, desc: 'Contracts agreed', color: '#23784F', conversion: '94%' },
    { id: 'active', name: 'Active Studio', count: activeCount, desc: 'In production sprint', color: '#171717', conversion: '90%' },
    { id: 'at_risk', name: 'At Risk', count: atRiskCount, desc: 'Requires intervention', color: '#B7791F', warning: atRiskCount > 0 },
    { id: 'lost', name: 'Lost / Churned', count: lostCount, desc: 'Exit recorded', color: '#E5484D' },
  ];

  // Stage details for inspector
  const getStageEntities = (stageId: string) => {
    switch (stageId) {
      case 'lead':
        return leads.filter((l) => l.stage === 'new').map((l) => ({ id: l.id, name: l.company, sub: l.name, val: formatCurrency(l.estimated_deal_value), link: '/acquisition' }));
      case 'contacted':
        return leads.filter((l) => l.stage === 'contacted' || l.stage === 'qualified' || l.stage === 'meeting').map((l) => ({ id: l.id, name: l.company, sub: `Stage: ${l.stage}`, val: formatCurrency(l.estimated_deal_value), link: '/acquisition' }));
      case 'proposal':
        return proposals.filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'negotiation').map((p) => ({ id: p.id, name: p.proposal_number, sub: p.client_name, val: formatCurrency(p.total_quoted_value), link: '/proposals' }));
      case 'won':
        return proposals.filter((p) => p.status === 'accepted').map((p) => ({ id: p.id, name: p.proposal_number, sub: p.client_name, val: formatCurrency(p.total_quoted_value), link: '/proposals' }));
      case 'active':
        return clients.filter((c) => c.status === 'active' || c.status === 'onboarding').map((c) => ({ id: c.id, name: c.name, sub: c.industry, val: `${formatCurrency(c.monthly_retainer)}/mo`, link: `/clients/${c.id}` }));
      case 'at_risk':
        return clients.filter((c) => c.status === 'at_risk').map((c) => ({ id: c.id, name: c.name, sub: `Health Score: ${c.health_score}/100`, val: `${formatCurrency(c.monthly_retainer)}/mo`, link: `/clients/${c.id}` }));
      case 'lost':
        return clientClosures.map((cl) => ({ id: cl.id, name: cl.client_name, sub: `Loss Reason: ${cl.primary_loss_reason}`, val: `Lost: ${formatCurrency(cl.annual_revenue_lost)}/yr`, link: '/retention' }));
      default:
        return [];
    }
  };

  const activeStageModal = stages.find((s) => s.id === selectedStage);
  const entities = selectedStage ? getStageEntities(selectedStage) : [];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
            Client Lifecycle Movement
          </h3>
          <p className="text-xs text-[#777777]">
            Agency pipeline velocity from inbound awareness to retained relationships
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase text-[#777777] bg-[#F7F6F2] px-2 py-1 rounded border border-[#E6E4DE]">
          Click stage to inspect
        </span>
      </div>

      {/* Horizontal Connected Lifecycle Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stages.map((stage, idx) => {
          return (
            <button
              key={stage.id}
              onClick={() => setSelectedStage(stage.id)}
              className={`p-3 rounded-xl border text-left transition-all group relative cursor-pointer ${
                stage.warning
                  ? 'border-[#FEEBC8] bg-[#FFFDF7] hover:border-[#F5A623]'
                  : 'border-[#E6E4DE] bg-[#FAFAF8] hover:border-[#171717] hover:bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#171717]">
                  {stage.name}
                </span>
                {stage.conversion && (
                  <span className="text-[9px] font-mono text-[#777777]">
                    {stage.conversion}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-editorial-mono text-[#171717]">
                  {stage.count}
                </span>
                <span className="text-[10px] text-[#777777]">records</span>
              </div>

              <p className="text-[10px] text-[#777777] mt-1 truncate">
                {stage.desc}
              </p>

              {/* Step indicator arrow for all except last */}
              {idx < stages.length - 1 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-[#FFFFFF] border border-[#E6E4DE] text-[#999999] flex items-center justify-center text-[10px]">
                  →
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Stage Inspector Modal */}
      {selectedStage && activeStageModal && (
        <Modal
          isOpen={Boolean(selectedStage)}
          onClose={() => setSelectedStage(null)}
          title={`Stage Inspector: ${activeStageModal.name} (${entities.length})`}
          description={activeStageModal.desc}
          maxWidth="lg"
        >
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {entities.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#777777]">
                No records currently residing in this lifecycle stage.
              </div>
            ) : (
              entities.map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setSelectedStage(null)}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#FFFFFF] hover:border-[#171717] transition-all group"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#171717] group-hover:text-black">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-[#777777]">{item.sub}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-[#171717]">{item.val}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#777777] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
