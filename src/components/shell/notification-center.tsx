'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Clock, AlertTriangle, FileText, Video } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, markNotificationRead, clearAllNotifications } = useAgencyStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getUrgencyIcon = (type: string, urgency: string) => {
    if (type === 'meeting_invitation') {
      return <Video className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />;
    }
    if (urgency === 'high') {
      return <AlertTriangle className="w-4 h-4 text-[#E5484D] shrink-0 mt-0.5" />;
    }
    if (type === 'proposal_decision') {
      return <FileText className="w-4 h-4 text-[#D7FF64] shrink-0 mt-0.5" />;
    }
    return <Clock className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />;
  };

  return (
    <div
      ref={dropdownRef}
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-10 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl z-50 animate-fade-in overflow-hidden max-h-[80vh] flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 shrink-0">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-900" />
          <span className="text-xs font-semibold text-gray-900 tracking-tight">Notifications</span>
        </div>
        <button
          onClick={clearAllNotifications}
          className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors font-medium cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            All clear. No notifications right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={cn(
                'p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer group',
                !n.is_read ? 'bg-blue-50/30' : 'opacity-80'
              )}
            >
              {getUrgencyIcon(n.type, n.urgency)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-gray-900 truncate">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{n.message}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-gray-400 shrink-0">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    href={n.link_url}
                    onClick={onClose}
                    className={cn(
                      'text-[11px] font-semibold flex items-center gap-1 shrink-0',
                      n.type === 'meeting_invitation'
                        ? 'text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 hover:bg-green-100'
                        : 'text-gray-900 underline underline-offset-2 hover:text-black'
                    )}
                  >
                    {n.type === 'meeting_invitation' ? 'Join Meeting →' : 'View record →'}
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
