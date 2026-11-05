'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Calendar } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Button } from '@/components/ui/button';
import { GlobalSearchModal } from '@/components/shell/global-search-modal';
import { NotificationCenter } from '@/components/shell/notification-center';
import { QuickCreateModal } from '@/components/shell/quick-create-modal';
import { RoleSwitcher } from '@/components/shell/role-switcher';
import { formatDate } from '@/lib/utils';

interface TopHeaderProps {
  onQuickAction?: (action: 'client' | 'lead' | 'proposal' | 'deliverable' | 'invoice' | 'expense') => void;
}

export function TopHeader({ onQuickAction }: TopHeaderProps) {
  const { unreadNotificationCount } = useAgencyStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(formatDate(new Date().toISOString(), 'EEEE, MMMM dd, yyyy'));
  }, []);

  return (
    <>
      <header className="border-b border-[#E6E4DE] bg-[#FFFFFF] sticky top-0 z-20">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Date */}
          <div className="flex items-center gap-2 text-xs font-mono text-[#777777]">
            <Calendar className="w-3.5 h-3.5 text-[#999999] shrink-0" />
            <span suppressHydrationWarning className="hidden sm:inline">{todayStr}</span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Global Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#F2EFE9] text-xs text-[#777777] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#555555]" />
              <span className="hidden sm:inline">Search clients...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#E6E4DE] text-[#555555] rounded">
                ⌘K
              </kbd>
            </button>

            {/* Add Client Button */}
            <Button
              variant="chartreuse"
              size="sm"
              onClick={() => setIsQuickCreateOpen(true)}
              className="gap-1.5 shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Client</span>
            </Button>

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <Bell className="w-4 h-4 text-[#171717]" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E5484D] text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </Button>
              <NotificationCenter
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
              />
            </div>

            {/* Role Switcher & Profile */}
            <RoleSwitcher />
          </div>
        </div>
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onActionSelect={(action) => {
          if (onQuickAction) onQuickAction(action);
        }}
      />
    </>
  );
}
