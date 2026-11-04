'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMeetingStore } from '@/lib/context/meeting-store-context';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { JitsiFrame } from '@/components/meetings/jitsi-frame';
import { InMeetingInviteModal } from '@/components/meetings/in-meeting-invite-modal';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Clock, Wifi, WifiOff, AlertCircle, Video,
  UserPlus, Copy, Check, PhoneOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { MeetingParticipant } from '@/lib/types';

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
  const { users, currentUser } = useAgencyStore();

  const [joinState, setJoinState] = useState<'validating' | 'ready' | 'error' | 'ended'>('validating');
  const [jitsiConfig, setJitsiConfig] = useState<{ room_id: string; jitsi_domain: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(0);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Active meeting record and participants
  const [currentMeeting, setCurrentMeeting] = useState(
    meetings.find((m) => m.id === meetingId) || null
  );

  const empId = currentEmployeeId || currentUser?.id || 'user_admin';
  const empName = currentEmployeeName || currentUser?.name || 'Admin';

  // 1. Fetch meeting record from PostgreSQL
  const fetchMeetingDetails = useCallback(async () => {
    if (!meetingId) return;
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.meeting) {
          setCurrentMeeting(data.meeting);
        }
      }
    } catch {}
  }, [meetingId]);

  // 2. Server Authorization & Join
  const handleJoin = useCallback(async () => {
    if (!meetingId) return;
    setJoinState('validating');
    try {
      const config = await joinMeeting(meetingId, empId, empName);
      setJitsiConfig(config);
      setJoinState('ready');
      fetchMeetingDetails();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to join meeting');
      setJoinState('error');
    }
  }, [meetingId, joinMeeting, empId, empName, fetchMeetingDetails]);

  useEffect(() => {
    handleJoin();
  }, [handleJoin]);

  // 3. Periodic refresh of participant list during active meeting (every 5s)
  useEffect(() => {
    if (joinState !== 'ready') return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchMeetingDetails();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [joinState, fetchMeetingDetails]);

  // 4. Leave / End Meeting
  const handleMeetingEnd = useCallback(async () => {
    setJoinState('ended');
    updateParticipantStatus(meetingId, empId, 'left');
    if (currentMeeting?.organizer_id === empId) {
      await endMeeting(meetingId);
    }
  }, [meetingId, empId, currentMeeting, endMeeting, updateParticipantStatus]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success('Meeting link copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (joinState === 'validating') {
    return (
      <div className="h-screen h-[100dvh] bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto" />
          <p className="text-white/70 text-sm font-medium">Verifying authorization & connecting to room…</p>
        </div>
      </div>
    );
  }

  if (joinState === 'error') {
    return (
      <div className="h-screen h-[100dvh] bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-900/40 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-white font-semibold text-base sm:text-lg">Cannot Join Meeting</h2>
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{errorMessage}</p>
          <div className="pt-2">
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Meetings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (joinState === 'ended') {
    return (
      <div className="h-screen h-[100dvh] bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center mx-auto">
            <Video className="w-6 h-6 text-green-400" />
          </div>
          <h2 className="text-white font-semibold text-base sm:text-lg">Meeting Ended</h2>
          <p className="text-gray-400 text-xs sm:text-sm">{currentMeeting?.title || 'Meeting'}</p>
          <div className="pt-2">
            <Link
              href="/meetings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Meetings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Active Meeting Room UI ──────────────────────────────────────────────────
  const participants = currentMeeting?.participants || [];
  const jitsiDomain = jitsiConfig?.jitsi_domain || process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
  const roomId = jitsiConfig?.room_id || currentMeeting?.room_id || '';
  const isOrganizer = currentMeeting?.organizer_id === empId;

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-gray-950 overflow-hidden select-none">
      {/* Top Header Bar (Responsive layout) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-gray-800 bg-gray-900 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link href="/meetings" className="text-gray-400 hover:text-white transition-colors shrink-0 p-1" title="Back to Meetings">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <h1 className="text-white font-semibold text-xs sm:text-sm leading-tight truncate">
                {currentMeeting?.title ?? 'Meeting'}
              </h1>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-green-400 bg-green-950/60 border border-green-800/60 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[11px] text-gray-400 truncate">
              <span className="hidden sm:flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {currentMeeting?.scheduled_at ? formatDate(currentMeeting.scheduled_at, 'h:mm a') : 'Instant'}
              </span>
              <span className="truncate">By <strong className="text-gray-300 font-medium">{currentMeeting?.organizer_name}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Share Meeting Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700 cursor-pointer"
            title="Copy Meeting Link"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Invite More Team Members */}
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
            title="Invite Employee"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </button>

          {/* End Meeting (Organizer only) */}
          {isOrganizer && (
            <button
              onClick={handleMeetingEnd}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-red-400 bg-red-950/50 hover:bg-red-900/60 border border-red-800/80 rounded-lg transition-colors cursor-pointer"
              title="End Meeting for All"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span className="hidden md:inline">End for All</span>
            </button>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1 text-xs text-green-400 pl-1 border-l border-gray-800">
            <Wifi className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Participants Banner */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2 bg-gray-900/80 border-b border-gray-800/80 shrink-0 text-xs text-gray-400">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scrollbar-none pr-3">
          <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 uppercase tracking-wider shrink-0">
            Team ({participants.length}):
          </span>
          {participants.map((p) => {
            const isMe = p.employee_id === empId;
            return (
              <div
                key={p.employee_id}
                title={`${p.employee_name} — status: ${p.invitation_status}`}
                className="flex items-center gap-1.5 shrink-0 bg-gray-800/70 border border-gray-700/60 px-2 py-0.5 rounded-full"
              >
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[9px] font-bold text-white">
                    {p.employee_name.charAt(0)}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-gray-900 ${
                      p.invitation_status === 'joined' ? 'bg-green-400 animate-pulse' :
                      p.invitation_status === 'accepted' ? 'bg-blue-400' :
                      p.invitation_status === 'left' ? 'bg-gray-500' :
                      p.invitation_status === 'declined' ? 'bg-red-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <span className={`text-[10px] sm:text-[11px] ${isMe ? 'text-white font-semibold' : 'text-gray-300'}`}>
                  {p.employee_name} {isMe && '(You)'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 capitalize">· {p.invitation_status}</span>
              </div>
            );
          })}
        </div>

        {participantCount > 0 && (
          <span className="shrink-0 text-[10px] sm:text-[11px] text-gray-400 font-mono hidden md:inline">
            Active: {participantCount}
          </span>
        )}
      </div>

      {/* Embedded Jitsi IFrame */}
      <div className="flex-1 overflow-hidden relative">
        {roomId ? (
          <JitsiFrame
            domain={jitsiDomain}
            roomId={roomId}
            displayName={empName}
            onMeetingEnd={handleMeetingEnd}
            onParticipantJoined={() => {
              setParticipantCount((n) => n + 1);
              fetchMeetingDetails();
            }}
            onParticipantLeft={() => {
              setParticipantCount((n) => Math.max(0, n - 1));
              fetchMeetingDetails();
            }}
            onError={(msg) => {
              setErrorMessage(msg);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2 p-4">
              <WifiOff className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-gray-400 text-sm">Room ID unavailable. Please return to Meetings.</p>
            </div>
          </div>
        )}
      </div>

      {/* In-Meeting Invite Modal */}
      {currentMeeting && (
        <InMeetingInviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          meetingId={currentMeeting.id}
          users={users}
          currentParticipants={participants}
          onInvited={(newParticipants: MeetingParticipant[]) => {
            setCurrentMeeting((prev) =>
              prev ? { ...prev, participants: newParticipants } : prev
            );
          }}
        />
      )}
    </div>
  );
}

function RoomSkeleton() {
  return (
    <div className="h-screen h-[100dvh] bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );
}
