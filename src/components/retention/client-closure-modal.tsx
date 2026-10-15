'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { LossReason, Client } from '@/lib/types';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { formatCurrency, getTodayDateString } from '@/lib/utils';

interface ClientClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

export function ClientClosureModal({ isOpen, onClose, client }: ClientClosureModalProps) {
  const { closeClient, users, currentUser } = useAgencyStore();

  const [closureDate, setClosureDate] = useState('2026-10-15');
  const [lastWorkingDate, setLastWorkingDate] = useState('2026-10-15');
  const [primaryLossReason, setPrimaryLossReason] = useState<LossReason>('Budget constraints');
  const [secondaryLossReason, setSecondaryLossReason] = useState<LossReason | ''>('');
  const [detailedExplanation, setDetailedExplanation] = useState('');
  const [clientFeedbackVerbatim, setClientFeedbackVerbatim] = useState('');
  const [isConfirmedFeedback, setIsConfirmedFeedback] = useState(true);
  const [outstandingInvoicesSettled, setOutstandingInvoicesSettled] = useState(true);
  const [unsettledBalance, setUnsettledBalance] = useState(0);
  const [pendingDeliverablesCleared, setPendingDeliverablesCleared] = useState(true);
  const [contractStatusAtExit, setContractStatusAtExit] = useState<
    'Expired' | 'Early Termination by Client' | 'Early Termination by Agency'
  >('Early Termination by Client');
  const [recoveryOpportunity, setRecoveryOpportunity] = useState<'High' | 'Medium' | 'Low' | 'None'>('Medium');
  const [recoveryFollowUpDate, setRecoveryFollowUpDate] = useState('2026-12-01');
  const [recoveryNotes, setRecoveryNotes] = useState('');

  const lossReasons: LossReason[] = [
    'Budget constraints',
    'Poor perceived results',
    'Communication problems',
    'Missed deadlines',
    'Quality issues',
    'Competitor selected',
    'Client business closure',
    'Internal strategic decision',
    'Service no longer required',
    'Contract not renewed',
    'Other',
  ];

  if (!client) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedExplanation) return;

    // Calculate lost annual revenue and duration
    const annualRevenueLost = (client.monthly_retainer || 0) * 12 + (client.project_value || 0);
    const startDate = new Date(client.contract_start_date);
    const endDate = new Date(closureDate);
    const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)));

    closeClient({
      client_id: client.id,
      client_name: client.name,
      closure_date: closureDate,
      last_working_date: lastWorkingDate,
      primary_loss_reason: primaryLossReason,
      secondary_loss_reason: secondaryLossReason ? (secondaryLossReason as LossReason) : undefined,
      detailed_explanation: detailedExplanation,
      client_feedback_verbatim: clientFeedbackVerbatim || undefined,
      is_confirmed_feedback: isConfirmedFeedback,
      account_manager_at_closure_id: client.account_manager_id,
      account_manager_name: client.account_manager_name || currentUser.name,
      outstanding_invoices_settled: outstandingInvoicesSettled,
      unsettled_balance: outstandingInvoicesSettled ? 0 : (unsettledBalance || client.outstanding_balance),
      pending_deliverables_cleared: pendingDeliverablesCleared,
      contract_status_at_exit: contractStatusAtExit,
      recovery_opportunity: recoveryOpportunity,
      recovery_follow_up_date: recoveryOpportunity !== 'None' ? recoveryFollowUpDate : undefined,
      recovery_notes: recoveryNotes || undefined,
      annual_revenue_lost: annualRevenueLost,
      relationship_duration_days: durationDays,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark Client Lost & Record Structured Closure`}
      description={`Mandatory exit interview workflow for ${client.name}. Captures empirical reasons for retention intelligence.`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner Warning */}
        <div className="p-3 bg-[#FFEBEA] border border-[#FDB8B6] rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#E5484D] shrink-0 mt-0.5" />
          <div className="text-xs text-[#171717]">
            <span className="font-semibold text-[#E5484D]">Client Closure Protocol: </span>
            This action will update <strong>{client.name}</strong> to Lost status, record annualized revenue impact of{' '}
            <strong>{formatCurrency((client.monthly_retainer || 0) * 12)}</strong>, and feed our machine retention analytics.
          </div>
        </div>

        {/* Primary & Secondary Loss Reason */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Primary Loss Reason *
            </label>
            <select
              value={primaryLossReason}
              onChange={(e) => setPrimaryLossReason(e.target.value as LossReason)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              {lossReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Secondary Contributing Reason
            </label>
            <select
              value={secondaryLossReason}
              onChange={(e) => setSecondaryLossReason(e.target.value as LossReason)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">None / Single primary cause</option>
              {lossReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Confirmed Feedback vs Internal Assumption Toggle */}
        <div className="p-3 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#171717]">Evidence Integrity</div>
            <div className="text-[11px] text-[#777777]">
              Is this confirmed directly by the client or based on internal studio assessment?
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfirmedFeedback(true)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                isConfirmedFeedback
                  ? 'bg-[#1C1C1A] text-[#D7FF64]'
                  : 'bg-[#FFFFFF] border border-[#E6E4DE] text-[#777777]'
              }`}
            >
              Confirmed Client Feedback
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmedFeedback(false)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                !isConfirmedFeedback
                  ? 'bg-[#1C1C1A] text-[#D7FF64]'
                  : 'bg-[#FFFFFF] border border-[#E6E4DE] text-[#777777]'
              }`}
            >
              Internal Assumption
            </button>
          </div>
        </div>

        {/* Verbatim Feedback & Detailed Explanation */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">
            Client Feedback Verbatim (Direct Quotes)
          </label>
          <textarea
            value={clientFeedbackVerbatim}
            onChange={(e) => setClientFeedbackVerbatim(e.target.value)}
            rows={2}
            placeholder="What exactly did the client say during the offboarding / exit call?..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">
            Internal Root-Cause Explanation *
          </label>
          <textarea
            required
            value={detailedExplanation}
            onChange={(e) => setDetailedExplanation(e.target.value)}
            rows={2}
            placeholder="Operational breakdown: What could the studio have done differently? Missed expectations?..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        {/* Financial & Deliverable Clearance Audit */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Outstanding Invoices
            </label>
            <select
              value={outstandingInvoicesSettled ? 'settled' : 'pending'}
              onChange={(e) => setOutstandingInvoicesSettled(e.target.value === 'settled')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="settled">Fully Settled (₹0 balance)</option>
              <option value="pending">Unsettled Balance Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Pending Deliverables
            </label>
            <select
              value={pendingDeliverablesCleared ? 'cleared' : 'pending'}
              onChange={(e) => setPendingDeliverablesCleared(e.target.value === 'cleared')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="cleared">All Assets Handed Over</option>
              <option value="pending">Outstanding Assets Incomplete</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Contract Exit Status
            </label>
            <select
              value={contractStatusAtExit}
              onChange={(e) => setContractStatusAtExit(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="Early Termination by Client">Early Termination by Client</option>
              <option value="Expired">Natural Contract Expiration</option>
              <option value="Early Termination by Agency">Early Termination by Studio</option>
            </select>
          </div>
        </div>

        {/* Win-back / Recovery Opportunity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Future Recovery Opportunity
            </label>
            <select
              value={recoveryOpportunity}
              onChange={(e) => setRecoveryOpportunity(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="High">High (e.g. following next funding round)</option>
              <option value="Medium">Medium (re-engage in 3-6 months)</option>
              <option value="Low">Low (unlikely to reconsider)</option>
              <option value="None">None (relationship severed)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">
              Follow-Up Re-Engagement Date
            </label>
            <input
              type="date"
              value={recoveryFollowUpDate}
              onChange={(e) => setRecoveryFollowUpDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit">
            Confirm Structured Closure
          </Button>
        </div>
      </form>
    </Modal>
  );
}
