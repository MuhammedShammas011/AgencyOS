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
    <AppShell showEditorialBanner={false}>
      <div className="space-y-6">
        {/* Page Title & Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#E6E4DE]/60">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#777777] mb-0.5 font-semibold">
              Agency Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-editorial-heading font-bold text-[#171717] tracking-tight">
              Command Center
            </h1>
          </div>
          <div className="text-xs text-[#777777] font-mono">
            Status: <span className="text-[#23784F] font-semibold">● Operations Healthy</span>
          </div>
        </div>

        {/* 1. Executive Vital Signs (4 Focused Cards) */}
        <section>
          <BusinessPulse />
        </section>

        {/* 2. Financial Performance & Immediate Action Items */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8">
            <RevenueTimeline />
          </div>
          <div className="lg:col-span-4">
            <OperationalRadar />
          </div>
        </section>

        {/* 3. Pipeline Funnel & Live Studio Activity Feed */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <ClientMovement />
          </div>
          <div className="lg:col-span-5">
            <ActivityStream />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
