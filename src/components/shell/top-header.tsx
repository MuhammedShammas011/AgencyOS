'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell, Calendar } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Button } from '@/components/ui/button';
import { GlobalSearchModal } from '@/components/shell/global-search-modal';
import { NotificationCenter } from '@/components/shell/notification-center';
import { QuickCreateModal } from '@/components/shell/quick-create-modal';
import { RoleSwitcher } from '@/components/shell/role-switcher';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TopHeaderProps {
  onQuickAction?: (action: 'client' | 'lead' | 'proposal' | 'deliverable' | 'invoice' | 'expense') => void;
  showEditorialBanner?: boolean;
}

export function TopHeader({ onQuickAction, showEditorialBanner = true }: TopHeaderProps) {
  const { operationalSummary, timeframe, setTimeframe, unreadNotificationCount } = useAgencyStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const [todayStr, setTodayStr] = useState('Thursday, October 15, 2026');

  useEffect(() => {
    setTodayStr(formatDate(new Date().toISOString(), 'EEEE, MMMM dd, yyyy'));
  }, []);

  return (
    <>
      <header className="border-b border-[#E6E4DE] bg-[#FFFFFF] sticky top-0 z-20">
        {/* Top Control Bar */}
        <div className="h-16 px-6 flex items-center justify-between gap-4">
          {/* Date & Subtext */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-[#777777]">
              <Calendar className="w-3.5 h-3.5 text-[#999999]" />
              <span>{todayStr}</span>
            </div>
            <span className="text-[#D1CFC7] hidden md:inline">•</span>
            <span className="text-xs text-[#777777] hidden md:inline">
              Workspace: <strong className="text-[#171717] font-medium">Headquarters (Mumbai & Global)</strong>
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Global Search trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#F2EFE9] text-xs text-[#777777] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#555555]" />
              <span className="hidden sm:inline">Search agency intelligence...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#E6E4DE] text-[#555555] rounded">
                ⌘K
              </kbd>
            </button>

            {/* Quick Create Action Button */}
            <Button
              variant="chartreuse"
              size="sm"
              onClick={() => setIsQuickCreateOpen(true)}
              className="gap-1.5 shadow-2xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Create</span>
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

        {/* Editorial Sub-Header Banner (Displayed on Command Center) */}
        {showEditorialBanner && (
          <div className="px-6 py-5 bg-[#F7F6F2] border-t border-[#E6E4DE] flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#777777] mb-1 font-semibold">
                Agency Intelligence Stream
              </div>
              <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight">
                Your agency, in focus.
              </h1>
              {/* Dynamic Operational Summary Statement */}
              <p className="text-xs sm:text-sm text-[#555555] mt-1.5 font-sans">
                <span className="font-semibold text-[#171717]">{operationalSummary.proposals_awaiting}</span> proposals awaiting decisions.{' '}
                <span className="font-semibold text-[#171717]">{operationalSummary.deliverables_overdue}</span> deliverables overdue.{' '}
                <span className="font-semibold text-[#171717]">{formatCurrency(operationalSummary.payments_due_this_week)}</span> in payments due this week.
              </p>
            </div>

            {/* Timeframe Selector Pill Group */}
            <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] rounded-lg border border-[#E6E4DE] self-start md:self-auto shadow-2xs">
              {(['7d', '30d', '90d', 'custom'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                      : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QuickCreateModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onActionSelect={(action) => {
          if (onQuickAction) {
            onQuickAction(action);
          }
        }}
      />
    </>
  );
}
