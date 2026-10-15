'use client';

import React from 'react';
import Link from 'next/link';
import { Client } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Building, ArrowRight, UserCheck, Calendar, Activity, AlertOctagon } from 'lucide-react';

interface ClientCardsProps {
  clients: Client[];
  onOpenClosure: (client: Client) => void;
}

export function ClientCards({ clients, onOpenClosure }: ClientCardsProps) {
  const getStatusVariant = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'onboarding':
        return 'chartreuse';
      case 'at_risk':
        return 'warning';
      case 'lost':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 85) return 'text-[#23784F] bg-[#EBF8F2] border-[#B7EBCE]';
    if (score >= 65) return 'text-[#B7791F] bg-[#FFF8E6] border-[#FEEBC8]';
    return 'text-[#E5484D] bg-[#FFEBEA] border-[#FDB8B6]';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => {
        const isLost = client.status === 'lost';
        return (
          <div
            key={client.id}
            className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs hover:border-[#171717] transition-all flex flex-col justify-between group"
          >
            <div>
              {/* Header: Company & Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-[#171717] tracking-tight truncate group-hover:text-black">
                      {client.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[#777777] truncate mt-0.5">{client.company}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${getHealthBadge(
                      client.health_score
                    )}`}
                    title="Client Health Score (0-100)"
                  >
                    {client.health_score} HP
                  </span>
                  <Badge variant={getStatusVariant(client.status)}>
                    {client.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Industry & Services */}
              <div className="text-[11px] font-mono text-[#555555] mb-3">
                {client.industry}
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {client.services.map((svc, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#E6E4DE] text-[#666666]"
                  >
                    {svc}
                  </span>
                ))}
              </div>

              {/* Financial snapshot */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#FAFAF8] border border-[#E6E4DE] mb-4 text-xs font-mono">
                <div>
                  <div className="text-[10px] text-[#777777] uppercase">Monthly Retainer</div>
                  <div className="text-sm font-bold text-[#171717]">
                    {client.monthly_retainer > 0 ? `${formatCurrency(client.monthly_retainer)}` : 'Project-Based'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-[#777777] uppercase">Outstanding</div>
                  <div
                    className={`text-sm font-bold ${
                      client.outstanding_balance > 0 ? 'text-[#E5484D]' : 'text-[#23784F]'
                    }`}
                  >
                    {formatCurrency(client.outstanding_balance)}
                  </div>
                </div>
              </div>

              {/* Next Action Context */}
              {client.next_action && (
                <div className="p-2.5 rounded-lg border border-[#ECEAE4] bg-[#FDFDFB] mb-3 text-xs">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
                    <span className="uppercase">Next Action</span>
                    {client.next_action_due && <span>Due: {formatDate(client.next_action_due)}</span>}
                  </div>
                  <p className="text-[11px] text-[#333333] line-clamp-2 leading-tight">
                    {client.next_action}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Footer: Work Lead and Lead Originator */}
            <div className="pt-3 border-t border-[#E6E4DE] flex items-center justify-between gap-2">
              <div className="flex flex-col text-[11px] min-w-0">
                <div className="flex items-center gap-1.5 font-semibold text-[#171717] truncate">
                  <UserCheck className="w-3.5 h-3.5 text-[#171717] shrink-0" />
                  <span>{client.account_manager_name || 'Unassigned'}</span>
                  <span className="text-[10px] font-normal text-[#777777]">
                    ({client.account_manager_name === 'Shammas' ? 'Web Dev' : client.account_manager_name === 'Shadin' ? 'Branding' : 'Lead'})
                  </span>
                </div>
                <div className="text-[10px] text-[#777777] font-mono truncate mt-0.5">
                  Brought by: <strong className="text-[#171717]">{client.sales_owner_name || client.referring_person || 'Direct'}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isLost && (
                  <button
                    onClick={() => onOpenClosure(client)}
                    className="text-[11px] text-[#777777] hover:text-[#E5484D] px-2 py-1 rounded hover:bg-[#FFEBEA] transition-colors"
                    title="Mark Lost & Record Structured Closure"
                  >
                    Mark Lost
                  </button>
                )}
                <Link
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-1 text-xs font-semibold text-[#171717] hover:text-black group-hover:underline underline-offset-4"
                >
                  <span>Open Space</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
