'use client';

/**
 * Meeting Store Context
 *
 * Manages meeting state client-side using localStorage for instant responsiveness
 * during development. API calls persist to PostgreSQL when the DB is available.
 * This keeps the ERP functional even when the DB is unreachable.
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { Meeting, MeetingParticipant, MeetingStatus, ParticipantStatus } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { toast } from 'sonner';

interface MeetingStoreContextType {
  meetings: Meeting[];
  isLoading: boolean;
  currentEmployeeId: string;
  currentEmployeeName: string;

  // Actions
  createMeeting: (params: {
    title: string;
    description?: string;
    organizer_id: string;
    organizer_name: string;
    scheduled_at?: string;
    duration_minutes?: number;
    participant_ids: string[];
    participant_names: string[];
  }) => Promise<Meeting>;

  endMeeting: (meetingId: string) => Promise<void>;
  cancelMeeting: (meetingId: string) => Promise<void>;
  joinMeeting: (meetingId: string, employeeId: string, employeeName: string) => Promise<{ room_id: string; jitsi_domain: string }>;
  refreshMeetings: (employeeId: string) => Promise<void>;
  updateParticipantStatus: (meetingId: string, employeeId: string, status: ParticipantStatus) => void;
}

const MeetingStoreContext = createContext<MeetingStoreContextType | undefined>(undefined);

const LOCAL_KEY = 'agency_os_meetings_v1';

function loadLocal(): Meeting[] {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveLocal(meetings: Meeting[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(meetings));
  } catch { /* storage full */ }
}

/** Cryptographically random room ID, generated client-side as fallback.
 *  The server always generates its own when the DB is available. */
function localRoomId(): string {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const hex = Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `cubstudio-meeting-${hex}`;
}

export function MeetingStoreProvider({
  children,
  currentEmployeeId,
  currentEmployeeName,
}: {
  children: ReactNode;
  currentEmployeeId: string;
  currentEmployeeName: string;
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setMeetings(loadLocal());
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    saveLocal(meetings);
  }, [meetings]);

  // ── Refresh from DB ─────────────────────────────────────────────────────────
  const refreshMeetings = useCallback(async (employeeId: string) => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/meetings?employee_id=${encodeURIComponent(employeeId)}`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } catch {
      // DB not reachable — keep local state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Create Meeting ──────────────────────────────────────────────────────────
  const createMeeting = useCallback(async (params: {
    title: string;
    description?: string;
    organizer_id: string;
    organizer_name: string;
    scheduled_at?: string;
    duration_minutes?: number;
    participant_ids: string[];
    participant_names: string[];
  }): Promise<Meeting> => {

    // Build participant list locally first (immediate UI update)
    const participantsList: MeetingParticipant[] = params.participant_ids
      .filter((id) => id !== params.organizer_id)
      .map((eid, i) => ({
        id: generateId('mprt'),
        meeting_id: '',
        employee_id: eid,
        employee_name: params.participant_names[i] ?? eid,
        invitation_status: 'invited' as ParticipantStatus,
        created_at: new Date().toISOString(),
      }));

    // Add organizer
    participantsList.unshift({
      id: generateId('mprt'),
      meeting_id: '',
      employee_id: params.organizer_id,
      employee_name: params.organizer_name,
      invitation_status: 'accepted' as ParticipantStatus,
      created_at: new Date().toISOString(),
    });

    const localMeeting: Meeting = {
      id: generateId('mtg'),
      title: params.title,
      description: params.description,
      room_id: localRoomId(),
      organizer_id: params.organizer_id,
      organizer_name: params.organizer_name,
      scheduled_at: params.scheduled_at,
      duration_minutes: params.duration_minutes ?? 60,
      status: params.scheduled_at ? 'scheduled' : 'live',
      participants: participantsList,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistic update
    setMeetings((prev) => [localMeeting, ...prev]);

    // Try to persist to DB
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        const dbMeeting: Meeting = data.meeting;
        // Replace local meeting with DB version
        setMeetings((prev) => prev.map((m) => (m.id === localMeeting.id ? dbMeeting : m)));
        return dbMeeting;
      }
    } catch {
      // DB offline — local version works for dev
    }

    return localMeeting;
  }, []);

  // ── End Meeting ─────────────────────────────────────────────────────────────
  const endMeeting = useCallback(async (meetingId: string) => {
    const endedAt = new Date().toISOString();
    setMeetings((prev) => prev.map((m) =>
      m.id === meetingId ? { ...m, status: 'ended' as MeetingStatus, ended_at: endedAt, updated_at: endedAt } : m
    ));
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended', ended_at: endedAt }),
      });
    } catch { /* offline */ }
    toast.success('Meeting ended');
  }, []);

  // ── Cancel Meeting ──────────────────────────────────────────────────────────
  const cancelMeeting = useCallback(async (meetingId: string) => {
    setMeetings((prev) => prev.map((m) =>
      m.id === meetingId ? { ...m, status: 'cancelled' as MeetingStatus, updated_at: new Date().toISOString() } : m
    ));
    try {
      await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
    } catch { /* offline */ }
    toast.success('Meeting cancelled');
  }, []);

  // ── Join Meeting ────────────────────────────────────────────────────────────
  const joinMeeting = useCallback(async (
    meetingId: string,
    employeeId: string,
    employeeName: string,
  ): Promise<{ room_id: string; jitsi_domain: string }> => {
    // Optimistic: mark as joined locally
    setMeetings((prev) => prev.map((m) => {
      if (m.id !== meetingId) return m;
      const updatedParts = m.participants.map((p) =>
        p.employee_id === employeeId
          ? { ...p, invitation_status: 'joined' as ParticipantStatus, joined_at: new Date().toISOString() }
          : p
      );
      return { ...m, status: 'live' as MeetingStatus, participants: updatedParts };
    }));

    // Try server validation
    try {
      const res = await fetch(`/api/meetings/${meetingId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, employee_name: employeeName }),
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 403) {
        const data = await res.json();
        throw new Error(data.error || 'Access denied');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Access denied') throw err;
      // DB offline — fall through to local room_id
    }

    // Fallback: use locally stored room_id
    const meeting = meetings.find((m) => m.id === meetingId);
    if (!meeting) throw new Error('Meeting not found');
    return {
      room_id: meeting.room_id,
      jitsi_domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si',
    };
  }, [meetings]);

  // ── Update participant status (local only) ──────────────────────────────────
  const updateParticipantStatus = useCallback((
    meetingId: string,
    employeeId: string,
    status: ParticipantStatus,
  ) => {
    setMeetings((prev) => prev.map((m) => {
      if (m.id !== meetingId) return m;
      return {
        ...m,
        participants: m.participants.map((p) =>
          p.employee_id === employeeId ? { ...p, invitation_status: status } : p
        ),
      };
    }));
  }, []);

  return (
    <MeetingStoreContext.Provider value={{
      meetings,
      isLoading,
      currentEmployeeId,
      currentEmployeeName,
      createMeeting,
      endMeeting,
      cancelMeeting,
      joinMeeting,
      refreshMeetings,
      updateParticipantStatus,
    }}>
      {children}
    </MeetingStoreContext.Provider>
  );
}

export function useMeetingStore() {
  const ctx = useContext(MeetingStoreContext);
  if (!ctx) throw new Error('useMeetingStore must be used within MeetingStoreProvider');
  return ctx;
}
