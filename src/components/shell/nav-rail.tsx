'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMeetingStore } from '@/lib/context/meeting-store-context';

const NAV_ITEMS = [
  { href: '/clients',  label: 'Clients',  icon: Users },
  { href: '/meetings', label: 'Meetings', icon: Video },
];

export function NavRail() {
  const pathname = usePathname();
  const { meetings } = useMeetingStore();

  // Count live meetings as a badge
  const liveMeetings = meetings.filter((m) => m.status === 'live').length;

  return (
    <aside className="bg-white border-r border-gray-100 flex flex-col shrink-0 w-56 h-screen sticky top-0 z-30">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100">
        <Link href="/clients" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-gray-900 text-white flex items-center justify-center text-xs font-bold tracking-tight">
            A
          </div>
          <span className="font-semibold text-sm text-gray-900 tracking-tight">Client Manager</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const badge = href === '/meetings' && liveMeetings > 0 ? liveMeetings : null;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
    </aside>
  );
}
