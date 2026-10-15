'use client';

import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { BusinessPulse } from '@/components/command-center/business-pulse';
import { ClientMovement } from '@/components/command-center/client-movement';
import { RevenueTimeline } from '@/components/command-center/revenue-timeline';
import { OperationalRadar } from '@/components/command-center/operational-radar';
import { ActivityStream } from '@/components/command-center/activity-stream';

export default function CommandCenterPage() {
  return (
    <AppShell showEditorialBanner={true}>
      <div className="space-y-6">
        {/* Section 1: Business Pulse Vital Signs */}
        <section>
          <BusinessPulse />
        </section>

        {/* Section 2: Client Movement Lifecycle Flow */}
        <section>
          <ClientMovement />
        </section>

        {/* Section 3: Revenue Timeline & Operational Radar */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <RevenueTimeline />
          </div>
          <div className="lg:col-span-5">
            <OperationalRadar />
          </div>
        </section>

        {/* Section 4: Recent Intelligence Activity Feed */}
        <section>
          <ActivityStream />
        </section>
      </div>
    </AppShell>
  );
}
