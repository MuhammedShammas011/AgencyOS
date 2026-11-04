'use client';

/**
 * Meeting Store Context
 *
 * Persists all company meetings to central PostgreSQL database.
 * Synchronizes meeting list and participants in real time with
 * Supabase Realtime WebSocket events and fallback polling.
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { Meeting, MeetingParticipant, MeetingStatus, ParticipantStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
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
  refreshMeetings: (employeeId: string, silent?: boolean) => Promise<void>;
  updateParticipantStatus: (meetingId: string, employeeId: string, status: ParticipantStatus) => void;
}

const MeetingStoreContext = createContext<MeetingStoreContextType | undefined>(undefined);

const LOCAL_KEY = 'agency_os_meetings_v2';

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

  // Hydrate from localStorage on initial mount as instant local cache
  useEffect(() => {
    setMeetings(loadLocal());
  }, []);

  // Persist to localStorage on change as cache
  useEffect(() => {
    if (meetings.length > 0) {
      saveLocal(meetings);
    }
  }, [meetings]);

  // ── Refresh from PostgreSQL ──────────────────────────────────────────────────
  const refreshMeetings = useCallback(async (employeeId: string, silent = false) => {
    if (!employeeId) return;
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch(`/api/meetings?employee_id=${encodeURIComponent(employeeId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.meetings)) {
          setMeetings(data.meetings);
        }
      }
    } catch {
      // Keep existing state if offline
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // ── Supabase Realtime Subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !currentEmployeeId) return;

    const channel = supabase
      .channel('meetings-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => {
          refreshMeetings(currentEmployeeId, true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_participants' },
        () => {
          refreshMeetings(currentEmployeeId, true);
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [currentEmployeeId, refreshMeetings]);

  // ── Real-time polling synchronization (every 4s when tab is active) ─────────
  useEffect(() => {
    if (!currentEmployeeId) return;

    refreshMeetings(currentEmployeeId);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshMeetings(currentEmployeeId, true);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentEmployeeId, refreshMeetings]);

  // ── Create Meeting (Strict PostgreSQL persistence) ──────────────────────────
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
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Server error' }));
      const msg = errData.error || errData.details || 'Failed to save meeting in database';
      toast.error(msg);
      throw new Error(msg);
    }

    const data = await res.json();
    const dbMeeting: Meeting = data.meeting;

    setMeetings((prev) => [dbMeeting, ...prev.filter((m) => m.id !== dbMeeting.id)]);
    toast.success('Meeting created successfully');
    return dbMeeting;
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

  // ── Join Meeting (Server-side authorization) ────────────────────────────────
  const joinMeeting = useCallback(async (
    meetingId: string,
    employeeId: string,
    employeeName: string,
  ): Promise<{ room_id: string; jitsi_domain: string }> => {
    const res = await fetch(`/api/meetings/${meetingId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employeeId, employee_name: employeeName }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Unable to join meeting' }));
      throw new Error(data.error || 'Access denied to this meeting');
    }

    const data = await res.json();

    // Optimistically update local participant status
    setMeetings((prev) => prev.map((m) => {
      if (m.id !== meetingId) return m;
      const updatedParts = m.participants.map((p) =>
        p.employee_id === employeeId || p.employee_name === employeeName
          ? { ...p, invitation_status: 'joined' as ParticipantStatus, joined_at: new Date().toISOString() }
          : p
      );
      return { ...m, status: 'live' as MeetingStatus, participants: updatedParts };
    }));

    return data;
  }, []);

  // ── Update participant status locally ───────────────────────────────────────
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
