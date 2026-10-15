'use client';

import React from 'react';
import Link from 'next/link';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { isPastDate, formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowRight,
  Layers,
  DollarSign,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OperationalRadar() {
  const { deliverables, invoices, clients } = useAgencyStore();

  // 1. Overdue Deliverables
  const overdueDeliverables = deliverables
    .filter((d) => d.status !== 'approved' && d.status !== 'cancelled' && isPastDate(d.due_date))
    .slice(0, 2)
    .map((d) => ({
      id: d.id,
      title: d.title,
      entity: d.client_name,
      detail: `Due ${formatDate(d.due_date)} • ${d.assigned_owner_name}`,
      category: 'Deliverable Overdue',
      badgeVariant: 'destructive' as const,
      link: '/delivery',
      icon: Layers,
    }));

  // 2. Overdue Invoices
  const overdueInvoices = invoices
    .filter((inv) => (inv.status === 'overdue' || inv.status === 'partially_paid') && inv.outstanding_amount > 0 && isPastDate(inv.due_date))
    .slice(0, 2)
    .map((inv) => ({
      id: inv.id,
      title: `${inv.invoice_number} — ${formatCurrency(inv.outstanding_amount)}`,
      entity: inv.client_name,
      detail: `Due ${formatDate(inv.due_date)} • Follow-up needed`,
      category: 'Overdue Invoice',
      badgeVariant: 'warning' as const,
      link: '/financials',
      icon: DollarSign,
    }));

  // 3. Clients at Risk
  const atRiskClients = clients
    .filter((c) => c.status === 'at_risk')
    .slice(0, 1)
    .map((c) => ({
      id: c.id,
      title: `Health Score: ${c.health_score}/100`,
      entity: c.name,
      detail: c.next_action || 'Executive intervention required',
      category: 'Client At Risk',
      badgeVariant: 'warning' as const,
      link: `/clients/${c.id}`,
      icon: ShieldAlert,
    }));

  // Top 4 critical action items
  const priorityItems = [
    ...overdueDeliverables,
    ...overdueInvoices,
    ...atRiskClients,
  ].slice(0, 4);

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
              Action Items
            </h3>
            {priorityItems.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#FFEBEA] text-[#E5484D] text-[10px] font-mono font-bold flex items-center justify-center">
                {priorityItems.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-[#777777] uppercase">
            Priority Queue
          </span>
        </div>
        <p className="text-xs text-[#777777]">
          Items requiring executive decision or immediate studio follow-up
        </p>
      </div>

      <div className="space-y-2.5 flex-1">
        {priorityItems.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 rounded-lg bg-[#FAFAF8] border border-dashed border-[#E6E4DE]">
            <CheckCircle2 className="w-6 h-6 text-[#23784F] mb-1.5" />
            <p className="text-xs font-medium text-[#171717]">All systems nominal</p>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Zero overdue deliverables or pending critical alerts.
            </p>
          </div>
        ) : (
          priorityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.link}
                className="flex items-start justify-between p-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#FFFFFF] hover:border-[#171717]/30 transition-all group shadow-2xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-[#FFFFFF] border border-[#E6E4DE] text-[#171717] shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#171717] truncate">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-[#555555] truncate">
                      {item.entity}
                    </p>
                    <p className="text-[10px] text-[#888888] truncate">
                      {item.detail}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <Badge variant={item.badgeVariant}>
                    {item.category.split(' ')[0]}
                  </Badge>
                  <span className="text-[10px] font-medium text-[#777777] group-hover:text-[#171717] flex items-center gap-0.5 pt-1">
                    Act <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="pt-2 border-t border-[#F2EFE9] flex items-center justify-between text-[11px]">
        <span className="text-[#888888]">Direct studio gates</span>
        <Link
          href="/delivery"
          className="font-mono text-[#171717] hover:underline flex items-center gap-1"
        >
          Delivery Matrix <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}
