'use client';

import React, { useState } from 'react';
import { NavRail } from './nav-rail';
import { EmployeeSwitcher } from './employee-switcher';
import { NotificationCenter } from './notification-center';
import { Bell, Menu } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { unreadNotificationCount } = useAgencyStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Navigation (Sidebar on Desktop, Drawer on Mobile) */}
      <NavRail
        mobileOpen={isMobileNavOpen}
        onMobileClose={() => setIsMobileNavOpen(false)}
      />

      <div className="flex flex-col flex-1 h-full min-w-0 overflow-y-auto">
        {/* Minimal SaaS Top Header */}
        <header className="h-14 border-b border-gray-100 bg-white px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors md:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs font-medium text-gray-400 truncate">
              <span className="hidden sm:inline">Agency OS · </span>Internal Portal
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>
              <NotificationCenter
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
              />
            </div>

            {/* Employee Profile Switcher */}
            <EmployeeSwitcher />
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
