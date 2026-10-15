'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatRelativeTime } from '@/lib/utils';
import {
  Activity,
  FileCheck,
  CreditCard,
  FileText,
  UserCheck,
  Layers,
  Receipt,
  UserPlus,
  ShieldAlert
} from 'lucide-react';

export function ActivityStream() {
  const { activityLogs } = useAgencyStore();

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'payment_received':
        return <CreditCard className="w-3.5 h-3.5 text-[#30A46C]" />;
      case 'proposal_accepted':
        return <FileCheck className="w-3.5 h-3.5 text-[#D7FF64]" />;
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

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
            Recent Intelligence Stream
          </h3>
          <p className="text-xs text-[#777777]">
            Real-time audit log of team actions, financial events, and client approvals
          </p>
        </div>
        <span className="text-[10px] font-mono uppercase text-[#777777] bg-[#F7F6F2] px-2 py-1 rounded border border-[#E6E4DE]">
          Live Event Bus
        </span>
      </div>

      <div className="divide-y divide-[#E6E4DE] max-h-96 overflow-y-auto">
        {activityLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777777]">
            No recent activity recorded.
          </div>
        ) : (
          activityLogs.map((log) => (
            <div key={log.id} className="py-3 px-1 flex items-start gap-3 group">
              <div className="p-2 rounded-full bg-[#FAFAF8] border border-[#E6E4DE] shrink-0 mt-0.5">
                {getActionIcon(log.action_type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#171717] truncate">
                    {log.actor_name}
                  </span>
                  <span className="text-[10px] font-mono text-[#999999] shrink-0">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>

                <div className="text-[10px] text-[#777777] font-mono uppercase">
                  {log.actor_role}
                </div>

                <p className="text-xs text-[#333333] mt-1 leading-relaxed">
                  {log.description}
                </p>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#F2EFE9] text-[#555555] rounded">
                    {log.entity_type.toUpperCase()}: {log.entity_name}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
