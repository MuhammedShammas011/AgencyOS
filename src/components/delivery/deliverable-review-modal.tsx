'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Deliverable, DeliverableStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle2, RotateCcw, AlertTriangle, UploadCloud } from 'lucide-react';

interface DeliverableReviewModalProps {
  deliverable: Deliverable | null;
  onClose: () => void;
}

export function DeliverableReviewModal({ deliverable, onClose }: DeliverableReviewModalProps) {
  const { updateDeliverableStatus, submitDeliverableVersion } = useAgencyStore();

  const [newVersionUrl, setNewVersionUrl] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'review' | 'upload_version'>('review');

  if (!deliverable) return null;

  const handleStatusUpdate = (status: DeliverableStatus) => {
    updateDeliverableStatus(deliverable.id, status, reviewNotes || undefined);
    onClose();
  };

  const handleUploadNewVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionUrl) return;

    submitDeliverableVersion(deliverable.id, newVersionUrl, reviewNotes || undefined);
    setNewVersionUrl('');
    setReviewNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(deliverable)}
      onClose={onClose}
      title={`Review Deliverable: ${deliverable.title}`}
      description={`Asset review gate for ${deliverable.client_name} • Current Version: v${deliverable.current_version}`}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Review vs Upload New Version Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE]">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'review'
                ? 'bg-[#1C1C1A] text-[#D7FF64]'
                : 'text-[#777777] hover:text-[#171717]'
            }`}
          >
            Review & Gate Decision
          </button>
          <button
            onClick={() => setActiveTab('upload_version')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'upload_version'
                ? 'bg-[#1C1C1A] text-[#D7FF64]'
                : 'text-[#777777] hover:text-[#171717]'
            }`}
          >
            Upload New Version (v{deliverable.current_version + 1})
          </button>
        </div>

        {/* Deliverable Metadata Card */}
        <div className="p-3.5 bg-[#FAFAF8] rounded-xl border border-[#E6E4DE] text-xs font-mono space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Creative Lead</span>
              <span className="font-semibold text-[#171717]">{deliverable.assigned_owner_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Due Date</span>
              <span className="font-semibold text-[#171717]">{formatDate(deliverable.due_date)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Internal Review Gate</span>
              <Badge variant={deliverable.internal_review_status === 'passed' ? 'success' : 'default'}>
                {deliverable.internal_review_status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase block">Client Approval Status</span>
              <Badge
                variant={
                  deliverable.client_approval_status === 'approved'
                    ? 'success'
                    : deliverable.client_approval_status === 'revision_requested'
                    ? 'destructive'
                    : 'default'
                }
              >
                {deliverable.client_approval_status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {deliverable.file_or_preview_url && (
            <div className="pt-2 border-t border-[#E6E4DE] flex items-center justify-between">
              <span className="text-[11px] text-[#777777]">Current Asset Preview:</span>
              <a
                href={deliverable.file_or_preview_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-[#171717] underline hover:text-black"
              >
                Inspect Figma / Video Cut ↗
              </a>
            </div>
          )}
        </div>

        {/* TAB 1: REVIEW & GATE DECISION */}
        {activeTab === 'review' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Internal Review / Revision Notes
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Specific creative feedback, typography adjustments, grading changes, or client remarks..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
              />
            </div>

            <div className="pt-2 border-t border-[#E6E4DE] space-y-2">
              <span className="text-[10px] font-mono uppercase text-[#777777] tracking-wider block">
                Advance Approval Gate
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('ready_to_submit')}
                  className="text-xs"
                >
                  Pass Internal Review
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleStatusUpdate('submitted_to_client')}
                  className="text-xs"
                >
                  Submit to Client
                </Button>
                <Button
                  variant="chartreuse"
                  size="sm"
                  onClick={() => handleStatusUpdate('approved')}
                  className="text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Client Approved
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleStatusUpdate('revision_requested')}
                  className="text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Request Revision
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: UPLOAD NEW VERSION */
          <form onSubmit={handleUploadNewVersion} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Version {deliverable.current_version + 1} Preview URL / Cloud File *
              </label>
              <input
                required
                value={newVersionUrl}
                onChange={(e) => setNewVersionUrl(e.target.value)}
                placeholder="e.g. https://vimeo.com/preview/cut-v3 or Figma file link"
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#171717] mb-1">
                Changes Made in this Revision
              </label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Summary of changes addressed from previous client or CD feedback..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
              />
            </div>

            <Button variant="chartreuse" size="sm" type="submit" className="w-full">
              Publish Version {deliverable.current_version + 1} for Review
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
