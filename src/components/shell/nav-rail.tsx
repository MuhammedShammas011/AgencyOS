'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingStore } from '@/lib/context/meeting-store-context';

const NAV_ITEMS = [
  { href: '/clients',  label: 'Clients',  icon: Users },
  { href: '/meetings', label: 'Meetings', icon: Video },
];

interface NavRailProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function NavRail({ mobileOpen = false, onMobileClose }: NavRailProps) {
  const pathname = usePathname();
  const { meetings } = useMeetingStore();

  // Close mobile drawer on route change or Escape
  useEffect(() => {
    onMobileClose?.();
  }, [pathname, onMobileClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose?.();
    };
    if (mobileOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  // Count live meetings as a badge
  const liveMeetings = meetings.filter((m) => m.status === 'live').length;

  const navContent = (isMobile = false) => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <Link
          href="/clients"
          onClick={() => isMobile && onMobileClose?.()}
          className="flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
            A
          </div>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">Client Manager</span>
        </Link>
        {isMobile && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === '/meetings' && liveMeetings > 0 ? liveMeetings : null;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => isMobile && onMobileClose?.()}
              className={cn(
                'flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-gray-400')} />
                <span>{label}</span>
              </div>
              {badge && (
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-bold animate-pulse">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex bg-white border-r border-gray-100 flex-col shrink-0 w-56 h-screen sticky top-0 z-30">
        {navContent(false)}
      </aside>

      {/* Mobile Drawer (visible only when mobileOpen on < md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={onMobileClose}
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-64 max-w-[80vw] bg-white border-r border-gray-100 flex flex-col shadow-2xl z-10 animate-fade-in">
            {navContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
