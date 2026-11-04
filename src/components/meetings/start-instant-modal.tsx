'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';
import { Video, Users, Check, Loader2 } from 'lucide-react';

interface StartInstantModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  currentUserName: string;
  onConfirm: (params: {
    title: string;
    organizer_id: string;
    organizer_name: string;
    participant_ids: string[];
    participant_names: string[];
  }) => Promise<void>;
}

export function StartInstantModal({
  isOpen,
  onClose,
  users,
  currentUserId,
  currentUserName,
  onConfirm,
}: StartInstantModalProps) {
  const [title, setTitle] = useState(`${currentUserName}'s Meeting`);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const otherUsers = users.filter((u) => u.id !== currentUserId && u.is_active);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === otherUsers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(otherUsers.map((u) => u.id));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a meeting title.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    const participantNames = selectedIds.map(
      (id) => users.find((u) => u.id === id)?.name || id
    );

    try {
      await onConfirm({
        title: title.trim(),
        organizer_id: currentUserId,
        organizer_name: currentUserName,
        participant_ids: selectedIds,
        participant_names: participantNames,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Instant Meeting"
      description="Create a live room and invite team members to join right away."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Meeting Title */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Meeting Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design Sync, Urgent Standup..."
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            autoFocus
          />
        </div>

        {/* Organizer */}
        <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <span className="text-xs text-gray-500">Organizer</span>
          <span className="text-xs font-semibold text-gray-900">{currentUserName}</span>
        </div>

        {/* Invite Team Members */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span>Invite Team Members</span>
            </label>
            {otherUsers.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium cursor-pointer"
              >
                {selectedIds.length === otherUsers.length ? 'Clear all' : 'Select all'}
              </button>
            )}
          </div>

          {otherUsers.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">No other active employees found.</p>
          ) : (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 divide-y divide-gray-50 border border-gray-100 rounded-lg p-1.5">
              {otherUsers.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      checked ? 'bg-gray-100/70 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checked ? 'bg-gray-900 border-gray-900 text-white' : 'border-gray-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(u.id)}
                      className="sr-only"
                    />
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-900 truncate">{u.name}</div>
                      <div className="text-[10px] text-gray-400 truncate">{u.title}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {selectedIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1.5">
              {selectedIds.length} team member{selectedIds.length > 1 ? 's' : ''} will receive an in-app invite.
            </p>
          )}
        </div>

        {/* Action Buttons (Responsive stacking) */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-3 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto justify-center"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting || !title.trim()}
            className="gap-1.5 w-full sm:w-auto justify-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Starting...</span>
              </>
            ) : (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Start Meeting</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
