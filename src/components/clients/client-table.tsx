'use client';

import React from 'react';
import Link from 'next/link';
import { Client } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ShieldAlert } from 'lucide-react';

interface ClientTableProps {
  clients: Client[];
  onOpenClosure: (client: Client) => void;
}

export function ClientTable({ clients, onOpenClosure }: ClientTableProps) {
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

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
            <tr>
              <th className="px-4 py-3">Client & Company</th>
              <th className="px-4 py-3">Status & Health</th>
              <th className="px-4 py-3">Industry Vertical</th>
              <th className="px-4 py-3">Account Owner</th>
              <th className="px-4 py-3 text-right">Retainer / Mo</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3">Next Action</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4DE]">
            {clients.map((c) => {
              const isLost = c.status === 'lost';
              return (
                <tr key={c.id} className="hover:bg-[#F7F6F2] transition-colors group">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${c.id}`} className="block">
                      <div className="font-semibold text-[#171717] group-hover:underline">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#777777]">{c.company}</div>
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={getStatusVariant(c.status)}>{c.status.toUpperCase()}</Badge>
                      <span className="font-mono text-[10px] text-[#777777]">{c.health_score}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-[#555555]">{c.industry}</td>

                  <td className="px-4 py-3 text-[#171717] font-medium">
                    {c.account_manager_name || 'Unassigned'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold text-[#171717]">
                    {c.monthly_retainer > 0 ? formatCurrency(c.monthly_retainer) : 'Project'}
                  </td>

                  <td className="px-4 py-3 text-right font-mono font-semibold">
                    <span className={c.outstanding_balance > 0 ? 'text-[#E5484D]' : 'text-[#23784F]'}>
                      {formatCurrency(c.outstanding_balance)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[#555555] max-w-xs truncate">
                    {c.next_action || '—'}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!isLost && (
                        <button
                          onClick={() => onOpenClosure(c)}
                          className="text-[11px] text-[#777777] hover:text-[#E5484D] px-2 py-0.5 rounded hover:bg-[#FFEBEA]"
                        >
                          Mark Lost
                        </button>
                      )}
                      <Link
                        href={`/clients/${c.id}`}
                        className="p-1 rounded text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]"
                        title="Open Workspace"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
