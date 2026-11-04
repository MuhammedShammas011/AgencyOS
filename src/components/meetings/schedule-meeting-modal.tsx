'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/types';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  currentUserName: string;
  onConfirm: (params: {
    title: string;
    description?: string;
    organizer_id: string;
    organizer_name: string;
    scheduled_at?: string;
    duration_minutes: number;
    participant_ids: string[];
    participant_names: string[];
  }) => Promise<void>;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  users,
  currentUserId,
  currentUserName,
  onConfirm,
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const otherUsers = users.filter((u) => u.id !== currentUserId && u.is_active);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (instant: boolean) => {
    if (!title.trim()) { setError('Please enter a meeting title.'); return; }
    if (!instant && !date) { setError('Please select a date.'); return; }
    setError('');
    setIsSubmitting(true);

    const scheduledAt = instant ? undefined : `${date}T${time}:00`;
    const participantNames = selectedIds.map(
      (id) => users.find((u) => u.id === id)?.name ?? id
    );

    try {
      await onConfirm({
        title: title.trim(),
        description: description.trim() || undefined,
        organizer_id: currentUserId,
        organizer_name: currentUserName,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        participant_ids: selectedIds,
        participant_names: participantNames,
      });
      // Reset form
      setTitle(''); setDescription(''); setDate(''); setTime('09:00');
      setDuration(60); setSelectedIds([]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Meeting" maxWidth="lg">
      <div className="space-y-4 sm:space-y-5">
        {error && (
          <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Meeting Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Sync"
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agenda or notes..."
            rows={2}
            className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Date / Time / Duration (Responsive 1-col on mobile, 3-col on sm) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>

        {/* Invite Participants */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Invite Team Members
          </label>
          {otherUsers.length === 0 ? (
            <p className="text-xs text-gray-400">No other team members found.</p>
          ) : (
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {otherUsers.map((u) => {
                const checked = selectedIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      checked ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? 'bg-gray-900 border-gray-900' : 'border-gray-300'
                    }`}>
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleParticipant(u.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                        <div className="text-xs text-gray-400 truncate">{u.title}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {selectedIds.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">{selectedIds.length} participant{selectedIds.length > 1 ? 's' : ''} invited</p>
          )}
        </div>

        {/* Actions (Responsive layout) */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-between gap-2 sm:gap-3 pt-3 border-t border-gray-100">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting || !title.trim()}
            className="w-full sm:w-auto justify-center"
          >
            Start Instantly
          </Button>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto justify-center"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting || !title.trim() || !date}
              className="w-full sm:w-auto justify-center"
            >
              Schedule Meeting
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
