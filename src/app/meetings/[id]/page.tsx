'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMeetingStore } from '@/lib/context/meeting-store-context';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { JitsiFrame } from '@/components/meetings/jitsi-frame';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Users, Clock, Wifi, WifiOff, AlertCircle, Video,
} from 'lucide-react';

export default function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <React.Suspense fallback={<RoomSkeleton />}>
      <MeetingRoomContent params={params} />
    </React.Suspense>
  );
}

function MeetingRoomContent({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = use(params);
  const router = useRouter();
  const { meetings, joinMeeting, endMeeting, updateParticipantStatus, currentEmployeeId, currentEmployeeName } = useMeetingStore();
  const { currentUser } = useAgencyStore();

  const [joinState, setJoinState] = useState<'validating' | 'ready' | 'error' | 'ended'>('validating');
  const [jitsiConfig, setJitsiConfig] = useState<{ room_id: string; jitsi_domain: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  const meeting = meetings.find((m) => m.id === meetingId);

  // Use the ERP's identified employee, or fall back to context
  const empId = currentEmployeeId || currentUser?.id || 'unknown';
  const empName = currentEmployeeName || currentUser?.name || 'Unknown Employee';

  const handleJoin = useCallback(async () => {
    if (!meetingId) return;
    setJoinState('validating');
    try {
      const config = await joinMeeting(meetingId, empId, empName);
      setJitsiConfig(config);
      setJoinState('ready');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join meeting');
      setJoinState('error');
    }
  }, [meetingId, joinMeeting, empId, empName]);

  useEffect(() => {
    if (meeting) handleJoin();
    else {
      // Meeting might not be in local store yet — try to load it from API
      (async () => {
        try {
          const res = await fetch(`/api/meetings/${meetingId}`);
          if (!res.ok) { setJoinState('error'); setErrorMessage('Meeting not found.'); return; }
          // handleJoin() will be called once meeting lands in store via refresh
          handleJoin();
        } catch {
          handleJoin(); // try anyway with local store
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  const handleMeetingEnd = useCallback(async () => {
    setJoinState('ended');
    updateParticipantStatus(meetingId, empId, 'left');
    // Only the organizer ends the meeting for everyone
    if (meeting?.organizer_id === empId) {
      await endMeeting(meetingId);
    }
  }, [meetingId, empId, meeting, endMeeting, updateParticipantStatus]);

  if (joinState === 'validating') {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
          <p className="text-white/60 text-sm">Validating access…</p>
        </div>
      </div>
    );
  }

  if (joinState === 'error') {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Cannot Join Meeting</h2>
          <p className="text-gray-400 text-sm">{errorMessage}</p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  if (joinState === 'ended') {
    return (
      <div className="h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-white font-semibold text-lg">Meeting Ended</h2>
          <p className="text-gray-400 text-sm">{meeting?.title}</p>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  // ── Active Meeting Room ───────────────────────────────────────────────────

  const participants = meeting?.participants ?? [];
  const jitsiDomain = jitsiConfig?.jitsi_domain ?? process.env.NEXT_PUBLIC_JITSI_DOMAIN ?? 'meet.jit.si';
  const roomId = jitsiConfig?.room_id ?? meeting?.room_id ?? '';

  return (
    <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/meetings" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight">{meeting?.title ?? 'Meeting'}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {meeting?.scheduled_at ? formatDate(meeting.scheduled_at, 'MMM d, h:mm a') : 'Instant Meeting'}
              </span>
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" />
            <span>
              {participants.length} invited
              {participantCount > 0 && ` · ${participantCount} in call`}
            </span>
          </div>

          {/* Organizer badge */}
          {meeting?.organizer_id === empId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              Organizer
            </span>
          )}

          {/* Connection indicator */}
          <div className="flex items-center gap-1 text-xs text-green-400">
            <Wifi className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Participants strip */}
      <div className="flex items-center gap-2 px-5 py-2 bg-gray-900/50 border-b border-gray-800 shrink-0 overflow-x-auto">
        {participants.map((p) => (
          <div
            key={p.employee_id}
            title={`${p.employee_name} — ${p.invitation_status}`}
            className="flex items-center gap-1.5 shrink-0"
          >
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-white">
                {p.employee_name.charAt(0)}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-gray-900 ${
                p.invitation_status === 'joined' ? 'bg-green-500' :
                p.invitation_status === 'accepted' ? 'bg-blue-500' :
                p.invitation_status === 'left' ? 'bg-gray-600' :
                p.invitation_status === 'declined' ? 'bg-red-500' : 'bg-gray-500'
              }`} />
            </div>
            <span className="text-xs text-gray-400">{p.employee_name}</span>
          </div>
        ))}
      </div>

      {/* Jitsi Embed */}
      <div className="flex-1 overflow-hidden">
        {roomId ? (
          <JitsiFrame
            domain={jitsiDomain}
            roomId={roomId}
            displayName={empName}
            onMeetingEnd={handleMeetingEnd}
            onParticipantJoined={(p) => {
              setParticipantCount((n) => n + 1);
            }}
            onParticipantLeft={(p) => {
              setParticipantCount((n) => Math.max(0, n - 1));
            }}
            onError={(msg) => {
              setErrorMessage(msg);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <WifiOff className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm">Could not connect to meeting room.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}
