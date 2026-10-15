'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Wallet, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function BusinessPulse() {
  const { businessPulse, operationalSummary } = useAgencyStore();

  const metrics = [
    {
      label: 'Active Clients',
      value: businessPulse.active_clients.toString(),
      subtext: `+${businessPulse.new_clients_this_month} onboarded this month`,
      trend: '+12% vs last period',
      isPositive: true,
      icon: Users,
    },
    {
      label: 'Monthly Recurring Revenue',
      value: formatCurrency(businessPulse.mrr),
      subtext: 'Retainer base committed',
      trend: '+8.4% vs last period',
      isPositive: true,
      icon: TrendingUp,
      accent: true,
    },
    {
      label: 'Cash Collected',
      value: formatCurrency(businessPulse.total_revenue_collected),
      subtext: `Of ${formatCurrency(businessPulse.invoiced_revenue)} invoiced`,
      trend: 'Cash realization rate 76%',
      isPositive: true,
      icon: DollarSign,
    },
    {
      label: 'Outstanding Receivables',
      value: formatCurrency(businessPulse.outstanding_receivables),
      subtext: `${operationalSummary.payments_due_this_week > 0 ? formatCurrency(operationalSummary.payments_due_this_week) : '₹0'} due this week`,
      trend: operationalSummary.deliverables_overdue > 0 ? 'Follow-up needed' : 'Normal',
      isPositive: false,
      icon: Wallet,
      warning: businessPulse.outstanding_receivables > 0,
    },
    {
      label: 'Est. Operating Profit',
      value: formatCurrency(businessPulse.estimated_operating_profit),
      subtext: `${businessPulse.operating_profit_margin}% Operating Margin`,
      trend: 'Post direct agency expenses',
      isPositive: true,
      icon: CheckCircle2,
    },
    {
      label: 'Proposal Win Rate',
      value: `${businessPulse.proposal_conversion_rate}%`,
      subtext: `${operationalSummary.proposals_awaiting} active proposals`,
      trend: '+4% vs studio target',
      isPositive: true,
      icon: ArrowUpRight,
    },
    {
      label: 'Client Retention Rate',
      value: `${businessPulse.client_retention_rate}%`,
      subtext: 'Calculated over lifecycle',
      trend: 'Healthy benchmark (>85%)',
      isPositive: true,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D7FF64]" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Business Pulse • Financial & Operational Vital Signs
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[#777777]">
          Timeframe: <strong className="text-[#171717]">{businessPulse.timeframe.toUpperCase()}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                m.accent
                  ? 'bg-[#1C1C1A] text-white border-[#2F2F2C] shadow-sm'
                  : 'bg-[#FFFFFF] border-[#E6E4DE] text-[#171717] shadow-2xs hover:border-[#D1CFC7]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-medium truncate ${
                      m.accent ? 'text-[#A3A29E]' : 'text-[#777777]'
                    }`}
                  >
                    {m.label}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      m.accent ? 'text-[#D7FF64]' : 'text-[#999999]'
                    }`}
                  />
                </div>

                <div
                  className={`text-lg sm:text-xl font-editorial-mono font-bold tracking-tight ${
                    m.accent ? 'text-[#D7FF64]' : m.warning ? 'text-[#171717]' : 'text-[#171717]'
                  }`}
                >
                  {m.value}
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-inherit">
                <p
                  className={`text-[10px] leading-tight truncate ${
                    m.accent ? 'text-[#888888]' : 'text-[#777777]'
                  }`}
                >
                  {m.subtext}
                </p>
                <div
                  className={`text-[9px] font-mono mt-1 flex items-center gap-1 ${
                    m.accent
                      ? 'text-[#A3A29E]'
                      : m.isPositive
                      ? 'text-[#23784F]'
                      : 'text-[#B7791F]'
                  }`}
                >
                  {m.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
