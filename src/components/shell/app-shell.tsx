'use client';

import React from 'react';
import { NavRail } from './nav-rail';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      <NavRail />
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-y-auto">
        <main className="flex-1 p-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
