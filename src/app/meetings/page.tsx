'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { useMeetingStore } from '@/lib/context/meeting-store-context';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ScheduleMeetingModal } from '@/components/meetings/schedule-meeting-modal';
import { Button } from '@/components/ui/button';
import { Meeting } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Video, Plus, Calendar, Clock, Users, ChevronRight, Zap,
  History, CalendarCheck, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

type TabId = 'upcoming' | 'my' | 'history';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  live:      { label: 'Live',      color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  ended:     { label: 'Ended',     color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' },
} as const;

export default function MeetingsPage() {
  const router = useRouter();
  const { meetings, isLoading, createMeeting, cancelMeeting, refreshMeetings, currentEmployeeId, currentEmployeeName } = useMeetingStore();
  const { users, currentUser } = useAgencyStore();

  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const empId = currentEmployeeId || currentUser?.id || '';
  const empName = currentEmployeeName || currentUser?.name || 'Unknown Employee';

  // Refresh from DB on mount
  useEffect(() => {
    if (empId) refreshMeetings(empId);
  }, [empId, refreshMeetings]);

  // ── Instant meeting ───────────────────────────────────────────────────────
  const handleStartInstant = async () => {
    setIsStarting(true);
    try {
      const meeting = await createMeeting({
        title: `${empName}'s Meeting`,
        organizer_id: empId,
        organizer_name: empName,
        duration_minutes: 60,
        participant_ids: [],
        participant_names: [],
      });
      router.push(`/meetings/${meeting.id}`);
    } finally {
      setIsStarting(false);
    }
  };

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const now = new Date();

  const upcoming = meetings.filter((m) =>
    (m.status === 'scheduled' || m.status === 'live') &&
    (!m.scheduled_at || new Date(m.scheduled_at) >= now)
  );

  const myMeetings = meetings.filter((m) =>
    m.organizer_id === empId ||
    m.participants.some((p) => p.employee_id === empId)
  );

  const history = meetings.filter((m) =>
    m.status === 'ended' || m.status === 'cancelled' ||
    (m.scheduled_at && new Date(m.scheduled_at) < now && m.status === 'scheduled')
  );

  const tabCounts: Record<TabId, number> = {
    upcoming: upcoming.length,
    my: myMeetings.length,
    history: history.length,
  };

  const displayList: Meeting[] = activeTab === 'upcoming' ? upcoming
    : activeTab === 'my' ? myMeetings
    : history;

  const canJoin = (m: Meeting) => m.status === 'live' || m.status === 'scheduled';

  return (
    <AppShell>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Internal video conferencing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartInstant}
            disabled={isStarting}
            className="gap-1.5"
          >
            {isStarting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            Start Meeting
          </Button>
        </div>
      </div>

      {/* Quick-start card */}
      <div
        className="mb-6 p-5 bg-gray-900 text-white rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={handleStartInstant}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Start an Instant Meeting</div>
            <div className="text-xs text-gray-400 mt-0.5">Open a room right now — invite team members after joining.</div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-100">
        {([
          { id: 'upcoming', label: 'Upcoming', icon: CalendarCheck },
          { id: 'my', label: 'My Meetings', icon: Users },
          { id: 'history', label: 'History', icon: History },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {tabCounts[id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Meeting list */}
      {!isLoading && (
        <>
          {displayList.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {activeTab === 'upcoming' ? 'No upcoming meetings. Start one or schedule ahead.' :
               activeTab === 'my' ? "You haven't organized or joined any meetings yet." :
               'No meeting history yet.'}
            </div>
          ) : (
            <div className="space-y-2">
              {displayList.map((m) => {
                const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.scheduled;
                const isOrganizer = m.organizer_id === empId;
                const myParticipant = m.participants.find((p) => p.employee_id === empId);

                return (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          m.status === 'live' ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                          <Video className={`w-4 h-4 ${m.status === 'live' ? 'text-green-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">{m.title}</h3>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'live' ? `${cfg.dot} animate-pulse` : cfg.dot}`} />
                              {cfg.label}
                            </span>
                            {isOrganizer && (
                              <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">Organizer</span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {m.scheduled_at ? formatDate(m.scheduled_at, 'MMM d, yyyy · h:mm a') : 'Instant Meeting'}
                              {m.duration_minutes && ` · ${m.duration_minutes} min`}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {m.participants.length} participant{m.participants.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Participant avatars */}
                          <div className="flex items-center gap-1 mt-2">
                            {m.participants.slice(0, 6).map((p) => (
                              <div
                                key={p.employee_id}
                                title={`${p.employee_name} — ${p.invitation_status}`}
                                className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] font-semibold text-gray-600"
                              >
                                {p.employee_name.charAt(0)}
                              </div>
                            ))}
                            {m.participants.length > 6 && (
                              <span className="text-[10px] text-gray-400 ml-1">+{m.participants.length - 6}</span>
                            )}
                          </div>

                          {/* My RSVP status */}
                          {myParticipant && !isOrganizer && (
                            <div className="flex items-center gap-1.5 mt-2">
                              {myParticipant.invitation_status === 'joined' ? (
                                <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Joined</span>
                              ) : myParticipant.invitation_status === 'declined' ? (
                                <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> Declined</span>
                              ) : (
                                <span className="text-xs text-gray-400">Invited</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {canJoin(m) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => router.push(`/meetings/${m.id}`)}
                            className="gap-1.5"
                          >
                            <Video className="w-3.5 h-3.5" />
                            {m.status === 'live' ? 'Join' : 'Open'}
                          </Button>
                        )}
                        {isOrganizer && m.status === 'scheduled' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => cancelMeeting(m.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Schedule modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        users={users}
        currentUserId={empId}
        currentUserName={empName}
        onConfirm={async (params) => {
          const meeting = await createMeeting(params);
          if (!params.scheduled_at) {
            router.push(`/meetings/${meeting.id}`);
          }
        }}
      />
    </AppShell>
  );
}
