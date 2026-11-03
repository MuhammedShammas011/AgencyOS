'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NavRail() {
  const pathname = usePathname();

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
      <nav className="flex-1 p-3">
        <Link
          href="/clients"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/clients' || pathname.startsWith('/clients/')
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          <Users className={cn('w-4 h-4 shrink-0', pathname === '/clients' || pathname.startsWith('/clients/') ? 'text-white' : 'text-gray-400')} />
          <span>Clients</span>
        </Link>
      </nav>
    </aside>
  );
}
