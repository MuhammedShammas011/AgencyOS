'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { UserProfile, MeetingParticipant } from '@/lib/types';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InMeetingInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  users: UserProfile[];
  currentParticipants: MeetingParticipant[];
  onInvited: (newParticipants: MeetingParticipant[]) => void;
}

export function InMeetingInviteModal({
  isOpen,
  onClose,
  meetingId,
  users,
  currentParticipants,
  onInvited,
}: InMeetingInviteModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out employees who are already in participants
  const existingIds = currentParticipants.map((p) => p.employee_id);
  const eligibleUsers = users.filter((u) => !existingIds.includes(u.id) && u.is_active);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleInvite = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);

    const participantNames = selectedIds.map(
      (id) => users.find((u) => u.id === id)?.name || id
    );

    try {
      const res = await fetch(`/api/meetings/${meetingId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_ids: selectedIds,
          employee_names: participantNames,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send invitation');
      }

      const data = await res.json();
      if (data.participants) {
        onInvited(data.participants);
      }
      toast.success(`Invited ${selectedIds.length} employee${selectedIds.length > 1 ? 's' : ''}`);
      setSelectedIds([]);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error sending invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Add another employee to this active meeting."
      maxWidth="sm"
    >
      <div className="space-y-4">
        {eligibleUsers.length === 0 ? (
          <p className="text-xs text-gray-500 py-4 text-center">
            All team members have already been invited to this meeting.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {eligibleUsers.map((u) => {
              const checked = selectedIds.includes(u.id);
              return (
                <label
                  key={u.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    checked ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
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

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto justify-center">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleInvite}
            disabled={isSubmitting || selectedIds.length === 0}
            className="gap-1.5 w-full sm:w-auto justify-center"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            Invite ({selectedIds.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
