'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatRelativeTime } from '@/lib/utils';
import {
  Activity,
  FileCheck,
  CreditCard,
  FileText,
  Layers,
  Receipt,
  UserPlus,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export function ActivityStream() {
  const { activityLogs } = useAgencyStore();

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'payment_received':
        return <CreditCard className="w-3.5 h-3.5 text-[#30A46C]" />;
      case 'proposal_accepted':
        return <FileCheck className="w-3.5 h-3.5 text-[#23784F]" />;
      case 'proposal_sent':
        return <FileText className="w-3.5 h-3.5 text-[#777777]" />;
      case 'deliverable_submitted':
      case 'deliverable_approved':
        return <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />;
      case 'client_created':
      case 'lead_created':
        return <UserPlus className="w-3.5 h-3.5 text-[#171717]" />;
      case 'client_closure_recorded':
        return <ShieldAlert className="w-3.5 h-3.5 text-[#E5484D]" />;
      case 'expense_logged':
        return <Receipt className="w-3.5 h-3.5 text-[#B7791F]" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-[#777777]" />;
    }
  };

  const recentLogs = activityLogs.slice(0, 4);

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
            Recent Studio Activity
          </h3>
          <span className="text-[10px] font-mono uppercase text-[#777777] bg-[#F7F6F2] px-2 py-0.5 rounded border border-[#E6E4DE]">
            Live Feed
          </span>
        </div>
        <p className="text-xs text-[#777777]">
          Real-time updates on payments, deliverables, and client interactions
        </p>
      </div>

      <div className="space-y-3 flex-1">
        {recentLogs.map((log) => (
          <div
            key={log.id}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#FAFAF8] transition-colors border border-transparent hover:border-[#E6E4DE]"
          >
            <div className="p-1.5 rounded-md bg-[#F7F6F2] border border-[#E6E4DE] shrink-0 mt-0.5">
              {getActionIcon(log.action_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#171717] truncate">
                  {log.actor_name}
                </span>
                <span className="text-[10px] font-mono text-[#888888] shrink-0">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
              <p className="text-xs text-[#555555] line-clamp-1 mt-0.5">
                {log.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[#F2EFE9] flex items-center justify-between text-[11px]">
        <span className="text-[#888888]">Immutable audit trail</span>
        <Link
          href="/settings"
          className="font-mono text-[#171717] hover:underline flex items-center gap-1"
        >
          View all logs <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}
