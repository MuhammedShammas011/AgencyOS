'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatDate, isPastDate } from '@/lib/utils';
import { parseISO, differenceInDays } from 'date-fns';
import { Invoice } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Clock, AlertTriangle } from 'lucide-react';

interface ReceivablesAgingProps {
  onRecordPayment: (inv: Invoice) => void;
}

export function ReceivablesAging({ onRecordPayment }: ReceivablesAgingProps) {
  const { invoices } = useAgencyStore();

  const unpaidInvoices = invoices.filter(
    (inv) => inv.outstanding_amount > 0 && inv.status !== 'voided'
  );

  const referenceDate = new Date();

  // Categorize invoices into aging buckets
  const buckets = {
    current: [] as Invoice[],
    days1_30: [] as Invoice[],
    days31_60: [] as Invoice[],
    days60_plus: [] as Invoice[],
  };

  unpaidInvoices.forEach((inv) => {
    try {
      const due = parseISO(inv.due_date);
      const daysOverdue = differenceInDays(referenceDate, due);

      if (daysOverdue <= 0) {
        buckets.current.push(inv);
      } else if (daysOverdue <= 30) {
        buckets.days1_30.push(inv);
      } else if (daysOverdue <= 60) {
        buckets.days31_60.push(inv);
      } else {
        buckets.days60_plus.push(inv);
      }
    } catch {
      buckets.current.push(inv);
    }
  });

  const getBucketSum = (list: Invoice[]) => list.reduce((acc, i) => acc + i.outstanding_amount, 0);

  const agingTiers = [
    { label: 'Current (Not Due)', count: buckets.current.length, total: getBucketSum(buckets.current), variant: 'success' },
    { label: '1 - 30 Days Overdue', count: buckets.days1_30.length, total: getBucketSum(buckets.days1_30), variant: 'warning' },
    { label: '31 - 60 Days Overdue', count: buckets.days31_60.length, total: getBucketSum(buckets.days31_60), variant: 'destructive' },
    { label: '60+ Days Overdue', count: buckets.days60_plus.length, total: getBucketSum(buckets.days60_plus), variant: 'destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Aging Buckets Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {agingTiers.map((tier, idx) => (
          <div
            key={idx}
            className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-1"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-[#777777]">
              <span>{tier.label}</span>
              <span>{tier.count} Inv</span>
            </div>
            <div className="text-lg font-bold font-editorial-mono text-[#171717]">
              {formatCurrency(tier.total)}
            </div>
          </div>
        ))}
      </div>

      {/* Unpaid Invoices Table */}
      <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E6E4DE] flex items-center justify-between bg-[#FAFAF8]">
          <div>
            <h3 className="text-xs font-mono uppercase text-[#777777] font-semibold">
              Aging Accounts Receivable Ledger
            </h3>
            <p className="text-xs text-[#555555]">
              Outstanding client balance aging schedule for cash-flow collections
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#E5484D]">
            Total Outstanding: {formatCurrency(getBucketSum(unpaidInvoices))}
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
            <tr>
              <th className="px-4 py-3">Invoice #</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Invoiced</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Balance Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4DE]">
            {unpaidInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#777777]">
                  All client accounts fully paid. Zero outstanding receivables.
                </td>
              </tr>
            ) : (
              unpaidInvoices.map((inv) => {
                const isOverdue = isPastDate(inv.due_date);
                return (
                  <tr key={inv.id} className="hover:bg-[#F7F6F2] transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-[#171717]">
                      {inv.invoice_number}
                    </td>

                    <td className="px-4 py-3 font-medium text-[#171717]">
                      {inv.client_name}
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <span className={isOverdue ? 'text-[#E5484D] font-bold' : 'text-[#777777]'}>
                        {formatDate(inv.due_date)}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-[#777777]">
                      {formatCurrency(inv.total_amount)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-[#30A46C]">
                      {formatCurrency(inv.amount_paid)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-[#E5484D]">
                      {formatCurrency(inv.outstanding_amount)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant={inv.status === 'partially_paid' ? 'warning' : 'destructive'}>
                        {inv.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="chartreuse"
                        size="sm"
                        onClick={() => onRecordPayment(inv)}
                        className="text-[11px] h-7 px-2.5 font-semibold"
                      >
                        Record Payment
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
