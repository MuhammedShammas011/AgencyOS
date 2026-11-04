'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/shell/app-shell';
import { useMeetingStore } from '@/lib/context/meeting-store-context';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ScheduleMeetingModal } from '@/components/meetings/schedule-meeting-modal';
import { StartInstantModal } from '@/components/meetings/start-instant-modal';
import { Button } from '@/components/ui/button';
import { Meeting } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Video, Calendar, Clock, Users, ChevronRight, Zap,
  History, CalendarCheck, CheckCircle2, XCircle, Loader2,
} from 'lucide-react';

type TabId = 'upcoming' | 'my' | 'history';

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  live:      { label: 'Live Now',  color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  ended:     { label: 'Ended',     color: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-400' },
} as const;

export default function MeetingsPage() {
  const router = useRouter();
  const { meetings, isLoading, createMeeting, cancelMeeting, refreshMeetings, currentEmployeeId, currentEmployeeName } = useMeetingStore();
  const { users, currentUser } = useAgencyStore();

  const [activeTab, setActiveTab] = useState<TabId>('upcoming');
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isInstantOpen, setIsInstantOpen] = useState(false);

  const empId = currentEmployeeId || currentUser?.id || 'user_admin';
  const empName = currentEmployeeName || currentUser?.name || 'Admin';

  // Refresh from PostgreSQL on mount and when employee changes
  useEffect(() => {
    if (empId) refreshMeetings(empId);
  }, [empId, refreshMeetings]);

  // ── Tabs filtering ────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const now = mounted ? new Date() : null;

  // Active or upcoming meetings
  const upcoming = meetings.filter((m) =>
    (m.status === 'live') ||
    (m.status === 'scheduled' && (!m.scheduled_at || !now || new Date(m.scheduled_at) >= now))
  );

  // Meetings involving this employee
  const myMeetings = meetings.filter((m) =>
    m.organizer_id === empId ||
    m.participants.some((p) => p.employee_id === empId || p.employee_name === empName)
  );

  // Past or cancelled meetings
  const history = meetings.filter((m) =>
    m.status === 'ended' || m.status === 'cancelled' ||
    (m.status === 'scheduled' && m.scheduled_at && now && new Date(m.scheduled_at) < now)
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
      {/* Page Header (Responsive wrapping) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Meetings</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
            Internal video meetings & employee synchronization
          </p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsScheduleOpen(true)}
            className="gap-1.5 w-full sm:w-auto justify-center"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInstantOpen(true)}
            className="gap-1.5 w-full sm:w-auto justify-center"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Start Meeting</span>
          </Button>
        </div>
      </div>

      {/* Quick-Start Banner */}
      <div
        className="mb-6 p-4 sm:p-5 bg-gray-900 text-white rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-800 transition-colors shadow-2xs"
        onClick={() => setIsInstantOpen(true)}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
            <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">Start an Instant Meeting</div>
            <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Launch a live room, invite team members, and meet right inside the ERP.
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
      </div>

      {/* Navigation Tabs (Smooth horizontal scroll on small devices) */}
      <div className="flex items-center gap-1 mb-5 border-b border-gray-100 overflow-x-auto no-scrollbar scrollbar-none flex-nowrap pb-0.5">
        {([
          { id: 'upcoming', label: 'Upcoming & Live', icon: CalendarCheck },
          { id: 'my', label: 'My Meetings', icon: Users },
          { id: 'history', label: 'History', icon: History },
        ] as { id: TabId; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px shrink-0 cursor-pointer ${
              activeTab === id
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
            {tabCounts[id] > 0 && (
              <span className={`text-[10px] sm:text-xs px-1.5 py-0.2 rounded-full font-medium ${
                activeTab === id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {tabCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && displayList.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Meetings List */}
      {(!isLoading || displayList.length > 0) && (
        <>
          {displayList.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm bg-white border border-gray-100 rounded-xl p-8 shadow-2xs">
              {activeTab === 'upcoming'
                ? 'No active or upcoming meetings. Click "Start Meeting" to launch a live room.'
                : activeTab === 'my'
                ? "You haven't organized or been invited to any meetings yet."
                : 'No meeting history recorded yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {displayList.map((m) => {
                const cfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.scheduled;
                const isOrganizer = m.organizer_id === empId;
                const myParticipant = m.participants.find(
                  (p) => p.employee_id === empId || p.employee_name === empName
                );
                const isLive = m.status === 'live';

                return (
                  <div
                    key={m.id}
                    className={`bg-white border rounded-xl p-4 transition-all shadow-2xs ${
                      isLive
                        ? 'border-green-200 ring-1 ring-green-100'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      {/* Left: Meeting Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isLive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {m.title}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isLive ? `${cfg.dot} animate-pulse` : cfg.dot
                                }`}
                              />
                              {cfg.label}
                            </span>
                            {isOrganizer && (
                              <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                                Organizer ({m.organizer_name})
                              </span>
                            )}
                            {!isOrganizer && (
                              <span className="text-[10px] text-gray-400">
                                Hosted by {m.organizer_name}
                              </span>
                            )}
                          </div>

                          {m.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {m.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 sm:gap-4 mt-2 flex-wrap text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {m.scheduled_at
                                ? formatDate(m.scheduled_at, 'MMM d, yyyy · h:mm a')
                                : 'Instant Live Room'}
                              {m.duration_minutes && ` · ${m.duration_minutes} min`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-gray-400" />
                              {m.participants.length} participant{m.participants.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Participant Avatars */}
                          <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                            {m.participants.slice(0, 6).map((p) => (
                              <div
                                key={p.employee_id}
                                title={`${p.employee_name} (${p.invitation_status})`}
                                className="w-6 h-6 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[10px] font-semibold text-gray-600 shadow-2xs shrink-0"
                              >
                                {p.employee_name.charAt(0)}
                              </div>
                            ))}
                            {m.participants.length > 6 && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                +{m.participants.length - 6}
                              </span>
                            )}

                            {/* My RSVP status */}
                            {myParticipant && !isOrganizer && (
                              <span className="ml-2 text-xs flex items-center gap-1 font-medium">
                                {myParticipant.invitation_status === 'joined' ? (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Joined
                                  </span>
                                ) : myParticipant.invitation_status === 'declined' ? (
                                  <span className="text-red-500 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> Declined
                                  </span>
                                ) : (
                                  <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100">
                                    Invited
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Join / Manage Actions (Full-width on mobile for easy thumb tapping) */}
                      <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        {canJoin(m) && (
                          <Button
                            variant={isLive ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => router.push(`/meetings/${m.id}`)}
                            className={`w-full sm:w-auto justify-center ${
                              isLive
                                ? 'bg-green-600 hover:bg-green-700 text-white gap-1.5'
                                : 'gap-1.5'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isLive ? 'Join Meeting' : 'Open Room'}</span>
                          </Button>
                        )}
                        {isOrganizer && m.status === 'scheduled' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => cancelMeeting(m.id)}
                            className="text-red-500 hover:text-red-600 w-full sm:w-auto justify-center"
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

      {/* Start Instant Meeting Modal */}
      <StartInstantModal
        isOpen={isInstantOpen}
        onClose={() => setIsInstantOpen(false)}
        users={users}
        currentUserId={empId}
        currentUserName={empName}
        onConfirm={async (params) => {
          const meeting = await createMeeting(params);
          router.push(`/meetings/${meeting.id}`);
        }}
      />

      {/* Schedule Meeting Modal */}
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
