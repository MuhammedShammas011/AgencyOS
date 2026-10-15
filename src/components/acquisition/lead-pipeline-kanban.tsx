'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Lead, LeadPipelineStage } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus, CheckCircle2, User, Building, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function LeadPipelineKanban() {
  const { leads, updateLeadStage, convertLeadToClient, users } = useAgencyStore();

  const stages: { stage: LeadPipelineStage; label: string; desc: string }[] = [
    { stage: 'new', label: 'New Inquiries', desc: 'Awaiting first touch' },
    { stage: 'contacted', label: 'Contacted', desc: 'Outreach & qualification' },
    { stage: 'qualified', label: 'Qualified', desc: 'Budget & fit verified' },
    { stage: 'meeting', label: 'Discovery Meeting', desc: 'Creative pitch call' },
    { stage: 'proposal', label: 'Proposal Sent', desc: 'Scope under decision' },
    { stage: 'negotiation', label: 'Negotiation', desc: 'Commercial finalization' },
    { stage: 'won', label: 'Won', desc: 'Ready for onboarding' },
    { stage: 'lost', label: 'Lost', desc: 'Archived pipeline' },
  ];

  const handleStageChange = (leadId: string, newStage: LeadPipelineStage) => {
    updateLeadStage(leadId, newStage);
  };

  const handleConvertToClient = (lead: Lead) => {
    const client = convertLeadToClient(lead.id);
    if (client) {
      toast.success(`Converted ${lead.company} to active client!`);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {stages.map((col) => {
        const stageLeads = leads.filter((l) => l.stage === col.stage);
        const stageTotalValue = stageLeads.reduce((acc, l) => acc + (l.estimated_deal_value || 0), 0);
        const isWon = col.stage === 'won';
        const isLost = col.stage === 'lost';

        return (
          <div
            key={col.stage}
            className={`w-72 shrink-0 rounded-xl border p-3 flex flex-col min-h-[560px] ${
              isWon
                ? 'bg-[#F2FAF5] border-[#B7EBCE]'
                : isLost
                ? 'bg-[#FFF5F5] border-[#FDB8B6]'
                : 'bg-[#FAFAF8] border-[#E6E4DE]'
            }`}
          >
            {/* Header */}
            <div className="pb-3 border-b border-inherit mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#171717]">{col.label}</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E6E4DE] text-[#777777]">
                  {stageLeads.length}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#777777] mt-0.5">
                Vol: {formatCurrency(stageTotalValue)}
              </div>
            </div>

            {/* Cards in column */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {stageLeads.length === 0 ? (
                <div className="py-12 text-center text-[11px] text-[#999999]">
                  No prospects in this stage
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#E6E4DE] shadow-2xs hover:border-[#171717] transition-all space-y-2.5 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-[#171717] leading-tight">
                          {lead.company}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {lead.deal_type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-[#777777] mt-0.5">{lead.name}</div>
                    </div>

                    {/* Value & Channel */}
                    <div className="p-2 bg-[#FAFAF8] rounded border border-[#ECEAE4] space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-[#777777]">Estimated Value:</span>
                        <span className="font-bold text-[#171717]">{formatCurrency(lead.estimated_deal_value)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#777777]">Channel:</span>
                        <span className="text-[#171717] font-sans font-medium">{lead.acquisition_source}</span>
                      </div>
                      {lead.referring_person && (
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-[#777777]">Referrer:</span>
                          <span className="text-[#171717] font-sans font-medium">{lead.referring_person}</span>
                        </div>
                      )}
                    </div>

                    {/* Sales Owner & Follow-up */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#777777]">
                      <span>Owner: {lead.lead_owner_name}</span>
                      {lead.next_follow_up && (
                        <span>Follow-up: {formatDate(lead.next_follow_up, 'MMM dd')}</span>
                      )}
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                      <p className="text-[11px] text-[#555555] line-clamp-2 bg-[#FDFDFB] p-1.5 rounded border border-[#ECEAE4]">
                        {lead.notes}
                      </p>
                    )}

                    {/* Action Controls */}
                    <div className="pt-2 border-t border-[#ECEAE4] flex items-center justify-between gap-1">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as LeadPipelineStage)}
                        className="text-[10px] font-mono px-2 py-1 rounded border border-[#E6E4DE] bg-[#FFFFFF] text-[#171717] outline-none"
                      >
                        {stages.map((st) => (
                          <option key={st.stage} value={st.stage}>
                            Move: {st.label}
                          </option>
                        ))}
                      </select>

                      {lead.stage === 'won' && !lead.converted_client_id && (
                        <Button
                          variant="chartreuse"
                          size="sm"
                          onClick={() => handleConvertToClient(lead)}
                          className="text-[10px] h-7 px-2"
                        >
                          Convert to Client
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
