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

  const employeeName = employeeIdentity.identified && employeeIdentity.employeeName && employeeIdentity.employeeName !== 'Unknown Employee'
    ? employeeIdentity.employeeName
    : currentUser?.name || 'Admin';

  const employeeId = currentUser?.id || 'user_admin';

  return (
    <MeetingStoreProvider
      currentEmployeeId={employeeId}
      currentEmployeeName={employeeName}
    >
      {children}
    </MeetingStoreProvider>
  );
}
