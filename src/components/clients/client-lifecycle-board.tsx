'use client';

import React from 'react';
import Link from 'next/link';
import { Client, ClientStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';

interface ClientLifecycleBoardProps {
  clients: Client[];
  onOpenClosure: (client: Client) => void;
}

export function ClientLifecycleBoard({ clients, onOpenClosure }: ClientLifecycleBoardProps) {
  const { updateClient } = useAgencyStore();

  const columns: { status: ClientStatus; label: string; count: number }[] = [
    { status: 'onboarding', label: 'Onboarding Sprint', count: clients.filter((c) => c.status === 'onboarding').length },
    { status: 'active', label: 'Active Retainer / Studio', count: clients.filter((c) => c.status === 'active').length },
    { status: 'at_risk', label: 'At Risk (Intervention)', count: clients.filter((c) => c.status === 'at_risk').length },
    { status: 'paused', label: 'Temporarily Paused', count: clients.filter((c) => c.status === 'paused').length },
    { status: 'lost', label: 'Lost / Churned', count: clients.filter((c) => c.status === 'lost').length },
  ];

  const handleMoveStatus = (clientId: string, newStatus: ClientStatus, client: Client) => {
    if (newStatus === 'lost') {
      onOpenClosure(client);
    } else {
      updateClient(clientId, { status: newStatus });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const columnClients = clients.filter((c) => c.status === col.status);
        const isRiskCol = col.status === 'at_risk';

        return (
          <div
            key={col.status}
            className={`rounded-xl border p-3 flex flex-col h-full min-h-[500px] ${
              isRiskCol ? 'bg-[#FFFDF7] border-[#FEEBC8]' : 'bg-[#FAFAF8] border-[#E6E4DE]'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-3">
              <span className="text-xs font-semibold text-[#171717]">{col.label}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E6E4DE] text-[#777777]">
                {col.count}
              </span>
            </div>

            {/* Client Cards in Column */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnClients.length === 0 ? (
                <div className="py-12 text-center text-[11px] text-[#999999]">
                  No clients in this stage
                </div>
              ) : (
                columnClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3 bg-[#FFFFFF] rounded-lg border border-[#E6E4DE] shadow-2xs hover:border-[#171717] transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between">
                      <Link href={`/clients/${client.id}`} className="font-semibold text-xs text-[#171717] group-hover:underline">
                        {client.name}
                      </Link>
                      <span className="text-[10px] font-mono font-bold text-[#777777]">
                        {client.health_score}%
                      </span>
                    </div>

                    <div className="text-[10px] text-[#777777] font-mono">
                      {client.monthly_retainer > 0 ? `${formatCurrency(client.monthly_retainer)}/mo` : 'Project Value'}
                    </div>

                    {client.next_action && (
                      <div className="text-[11px] text-[#555555] line-clamp-2 bg-[#F7F6F2] p-1.5 rounded">
                        {client.next_action}
                      </div>
                    )}

                    {/* Stage Transition Selector */}
                    <div className="pt-2 border-t border-[#ECEAE4] flex items-center justify-between">
                      <select
                        value={client.status}
                        onChange={(e) => handleMoveStatus(client.id, e.target.value as ClientStatus, client)}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] text-[#555555]"
                      >
                        <option value="onboarding">Move to Onboarding</option>
                        <option value="active">Move to Active</option>
                        <option value="at_risk">Move to At Risk</option>
                        <option value="paused">Move to Paused</option>
                        <option value="lost">Mark as Lost</option>
                      </select>

                      <Link href={`/clients/${client.id}`} className="text-[#777777] hover:text-[#171717]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
