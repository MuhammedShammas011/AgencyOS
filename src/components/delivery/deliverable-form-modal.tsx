'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { DeliverableType, DeliverableStatus } from '@/lib/types';

interface DeliverableFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeliverableFormModal({ isOpen, onClose }: DeliverableFormModalProps) {
  const { addDeliverable, projects, clients, users, currentUser } = useAgencyStore();

  const [title, setTitle] = useState('');
  const [deliverableType, setDeliverableType] = useState<DeliverableType>('Brand Identity Book');
  const [projectId, setProjectId] = useState('');
  const [assignedOwnerId, setAssignedOwnerId] = useState(currentUser.id);
  const [dueDate, setDueDate] = useState('2026-10-29');

  React.useEffect(() => {
    setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
  }, []);
  const [fileUrl, setFileUrl] = useState('');
  const [status, setStatus] = useState<DeliverableStatus>('not_started');
  const [notes, setNotes] = useState('');

  const deliverableTypes: DeliverableType[] = [
    'Brand Identity Book',
    'Social Media Feed (12 Posts)',
    'Hero Brand Film / TVC',
    'Product Commercials',
    'E-Commerce Website',
    'PPC Ad Creatives & Copy',
    'Packaging Design Suite',
    'Editorial Photography Assets',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const project = projects.find((p) => p.id === projectId);
    const owner = users.find((u) => u.id === assignedOwnerId);

    addDeliverable({
      title,
      deliverable_type: deliverableType,
      project_id: projectId,
      project_name: project ? project.name : 'General Creative Scope',
      client_id: project ? project.client_id : (clients[0]?.id || ''),
      client_name: project ? project.client_name : (clients[0]?.name || 'Agency Client'),
      assigned_owner_id: assignedOwnerId,
      assigned_owner_name: owner ? owner.name : currentUser.name,
      due_date: dueDate,
      status,
      file_or_preview_url: fileUrl || undefined,
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Creative Deliverable"
      description="Track an internal creative deliverable, asset review cycles, and approval gate."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Deliverable Title *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Autumn Campaign Hero Cut (4K, 30s Master)"
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Deliverable Category *</label>
            <select
              value={deliverableType}
              onChange={(e) => setDeliverableType(e.target.value as DeliverableType)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              {deliverableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Linked Project *</label>
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">Select project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.client_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Assigned Creative Lead *</label>
            <select
              value={assignedOwnerId}
              onChange={(e) => setAssignedOwnerId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Hard Due Date *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Preview / Asset Link (Optional)</label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="e.g. https://figma.com/@agencyos/v1 or Vimeo/Drive link"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Current Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DeliverableStatus)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="internal_review">Internal Review</option>
              <option value="ready_to_submit">Ready to Submit</option>
              <option value="submitted_to_client">Submitted to Client</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Scope Specifications</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Technical aspect ratios, resolution, color space, export specs..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit">
            Add Deliverable
          </Button>
        </div>
      </form>
    </Modal>
  );
}
