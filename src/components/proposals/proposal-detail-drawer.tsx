'use client';

import React from 'react';
import { Proposal, ProposalStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { X, ArrowRight, CheckCircle2, XCircle, FileText, Clock, Layers, Sparkles } from 'lucide-react';

interface ProposalDetailDrawerProps {
  proposal: Proposal | null;
  onClose: () => void;
}

export function ProposalDetailDrawer({ proposal, onClose }: ProposalDetailDrawerProps) {
  const { updateProposalStatus, convertProposalToProject } = useAgencyStore();

  if (!proposal) return null;

  const isAccepted = proposal.status === 'accepted';
  const isRejected = proposal.status === 'rejected';

  const handleStatusChange = (status: ProposalStatus) => {
    updateProposalStatus(proposal.id, status);
  };

  const handleConvertToProject = () => {
    convertProposalToProject(proposal.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer Canvas */}
      <div className="relative w-full max-w-xl bg-[#FFFFFF] border-l border-[#E6E4DE] shadow-2xl z-10 h-full flex flex-col justify-between animate-fade-in overflow-hidden">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E6E4DE] bg-[#FAFAF8] flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[#171717]">
                {proposal.proposal_number}
              </span>
              <Badge variant="outline">Version {proposal.version}</Badge>
              <Badge
                variant={
                  isAccepted
                    ? 'success'
                    : isRejected
                    ? 'destructive'
                    : proposal.status === 'negotiation'
                    ? 'warning'
                    : 'default'
                }
              >
                {proposal.status.toUpperCase()}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-[#171717]">{proposal.client_name}</h2>
            <p className="text-xs text-[#777777]">{proposal.company}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Direct Action: Convert to Delivery Project */}
          {isAccepted && !proposal.resulting_project_id && (
            <div className="p-4 bg-[#F2FAF5] border border-[#B7EBCE] rounded-xl flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-[#23784F] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Ready for Studio Mobilization
                </span>
                <p className="text-[11px] text-[#555555] mt-0.5">
                  Convert this accepted scope directly into a Delivery Studio project with deliverables.
                </p>
              </div>
              <Button variant="chartreuse" size="sm" onClick={handleConvertToProject} className="shrink-0 font-semibold">
                Mobilize Project
              </Button>
            </div>
          )}

          {/* Key Dates & Owners */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAFAF8] rounded-xl border border-[#E6E4DE] font-mono">
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Sales Owner</span>
              <span className="text-xs font-semibold text-[#171717]">{proposal.sales_owner_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Valid Until</span>
              <span className="text-xs font-semibold text-[#171717]">{formatDate(proposal.valid_until)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Sent Date</span>
              <span className="text-xs">{formatDate(proposal.sent_date)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Decision Target</span>
              <span className="text-xs">{formatDate(proposal.expected_decision_date)}</span>
            </div>
          </div>

          {/* Itemized Deliverables Scope */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-[#777777] font-semibold">
              Itemized Deliverables & Pricing
            </h4>
            <div className="divide-y divide-[#E6E4DE] border border-[#E6E4DE] rounded-xl overflow-hidden bg-[#FFFFFF]">
              {proposal.items.map((item) => (
                <div key={item.id} className="p-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-[#171717]">{item.description}</div>
                    <div className="text-[11px] text-[#777777]">
                      {item.service_category} • Qty: {item.quantity} @ {formatCurrency(item.unit_price)}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#171717]">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 bg-[#1C1C1A] text-white rounded-xl border border-[#2F2F2C] space-y-2 font-mono">
            <div className="flex justify-between text-[#A3A29E]">
              <span>Subtotal:</span>
              <span>{formatCurrency(proposal.subtotal)}</span>
            </div>
            {proposal.discount_rate > 0 && (
              <div className="flex justify-between text-[#D7FF64]">
                <span>Discount ({proposal.discount_rate}%):</span>
                <span>- {formatCurrency(proposal.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#A3A29E]">
              <span>GST / Tax ({proposal.tax_rate}%):</span>
              <span>+ {formatCurrency(proposal.tax_amount)}</span>
            </div>
            <div className="pt-2 border-t border-[#2F2F2C] flex justify-between items-baseline text-sm font-bold text-[#D7FF64]">
              <span>Total Quoted Value:</span>
              <span className="text-lg">{formatCurrency(proposal.total_quoted_value)}</span>
            </div>
          </div>

          {/* Version History */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase text-[#777777] font-semibold">
              Revision & Version History
            </h4>
            <div className="space-y-1.5">
              {proposal.versions.map((v) => (
                <div key={v.version} className="p-2.5 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-[#171717]">Version {v.version}</span>
                    <span className="text-[10px] text-[#777777] ml-2">by {v.created_by_name}</span>
                    {v.changes_summary && (
                      <p className="text-[11px] text-[#555555] mt-0.5">{v.changes_summary}</p>
                    )}
                  </div>
                  <span className="font-mono font-semibold text-[#171717]">{formatCurrency(v.quoted_value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes or Feedback */}
          {proposal.notes && (
            <div>
              <h4 className="text-xs font-mono uppercase text-[#777777] font-semibold mb-1">Internal Notes</h4>
              <p className="p-3 bg-[#F7F6F2] rounded-lg border border-[#E6E4DE] text-[#444444]">{proposal.notes}</p>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {!isAccepted && (
              <Button
                variant="chartreuse"
                size="sm"
                onClick={() => handleStatusChange('accepted')}
                className="gap-1 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Accept Proposal
              </Button>
            )}
            {!isRejected && !isAccepted && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleStatusChange('rejected')}
                className="gap-1 text-xs"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
            )}
          </div>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
