'use client';

/**
 * MeetingStoreWrapper
 *
 * Bridges the AgencyStoreContext (which has the current user) with the
 * MeetingStoreProvider. Must be a client component because both contexts
 * are client-only.
 */

import React from 'react';
import { MeetingStoreProvider } from '@/lib/context/meeting-store-context';
import { useAgencyStore } from '@/lib/context/agency-store-context';

export function MeetingStoreWrapper({ children }: { children: React.ReactNode }) {
  const { currentUser, employeeIdentity } = useAgencyStore();

  // Prefer Tailscale-identified name, then current user from store
  const employeeName = employeeIdentity.identified && employeeIdentity.employeeName !== 'Unknown Employee'
    ? employeeIdentity.employeeName
    : currentUser?.name ?? 'Unknown Employee';

  const employeeId = currentUser?.id ?? 'unknown';

  return (
    <MeetingStoreProvider
      currentEmployeeId={employeeId}
      currentEmployeeName={employeeName}
    >
      {children}
    </MeetingStoreProvider>
  );
}
