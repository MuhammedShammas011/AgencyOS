'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
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
      className="absolute right-0 top-12 w-96 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-xl z-50 animate-fade-in overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E4DE] bg-[#FAFAF8]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#171717]" />
          <span className="text-xs font-semibold text-[#171717] tracking-tight">Notification Center</span>
        </div>
        <button
          onClick={clearAllNotifications}
          className="text-[11px] text-[#777777] hover:text-[#171717] flex items-center gap-1 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-[#E6E4DE]">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777777]">
            All clear. No active alerts right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={cn(
                'p-3.5 hover:bg-[#F7F6F2] transition-colors flex items-start gap-3 cursor-pointer group',
                !n.is_read ? 'bg-[#FCFCFA]' : 'opacity-70'
              )}
            >
              {getUrgencyIcon(n.type, n.urgency)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-semibold text-[#171717] truncate">{n.title}</span>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#E5484D] shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-[#555555] leading-relaxed line-clamp-2">{n.message}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#999999]">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    href={n.link_url}
                    onClick={onClose}
                    className="text-[11px] font-medium text-[#171717] group-hover:text-black underline underline-offset-2 flex items-center gap-1"
                  >
                    View record →
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
