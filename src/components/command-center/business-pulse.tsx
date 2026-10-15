'use client';

import React, { useState } from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import Link from 'next/link';

export function BusinessPulse() {
  const { businessPulse, operationalSummary } = useAgencyStore();
  const [showSecondary, setShowSecondary] = useState(false);

  // 4 Primary executive KPIs
  const primaryMetrics = [
    {
      label: 'Monthly Recurring Revenue',
      value: formatCurrency(businessPulse.mrr),
      subtext: 'Committed retainer revenue',
      badge: '+8.4% growth',
      icon: TrendingUp,
      accent: true,
      link: '/financials',
    },
    {
      label: 'Active Clients',
      value: `${businessPulse.active_clients}`,
      subtext: `+${businessPulse.new_clients_this_month} onboarded this month`,
      badge: `${businessPulse.client_retention_rate}% retention`,
      icon: Users,
      accent: false,
      link: '/clients',
    },
    {
      label: 'Cash Realized',
      value: formatCurrency(businessPulse.total_revenue_collected),
      subtext: `76% collected of billings`,
      badge: 'Positive cash flow',
      icon: DollarSign,
      accent: false,
      link: '/financials',
    },
    {
      label: 'Operating Profit',
      value: formatCurrency(businessPulse.estimated_operating_profit),
      subtext: `${businessPulse.operating_profit_margin}% net studio margin`,
      badge: 'Healthy benchmark',
      icon: CheckCircle2,
      accent: false,
      link: '/reports',
    },
  ];

  // Secondary metrics tucked into clean drawer
  const secondaryMetrics = [
    {
      label: 'Outstanding Receivables',
      value: formatCurrency(businessPulse.outstanding_receivables),
      subtext: `${operationalSummary.payments_due_this_week > 0 ? formatCurrency(operationalSummary.payments_due_this_week) : '₹0'} due this week`,
      icon: Wallet,
      link: '/financials',
    },
    {
      label: 'Proposal Conversion Rate',
      value: `${businessPulse.proposal_conversion_rate}%`,
      subtext: `${operationalSummary.proposals_awaiting} active proposals pending`,
      icon: ArrowUpRight,
      link: '/proposals',
    },
    {
      label: 'Client Retention Rate',
      value: `${businessPulse.client_retention_rate}%`,
      subtext: 'Lifetime agency retention benchmark',
      icon: ShieldCheck,
      link: '/retention',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Top Header bar with clean toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D7FF64]" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Executive Summary
          </h2>
        </div>

        <button
          onClick={() => setShowSecondary(!showSecondary)}
          className="flex items-center gap-1 text-xs text-[#777777] hover:text-[#171717] transition-colors font-mono cursor-pointer"
        >
          <span>{showSecondary ? 'Less details' : 'More metrics'}</span>
          {showSecondary ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 4 Focused Primary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {primaryMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <Link
              key={idx}
              href={m.link}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between group ${
                m.accent
                  ? 'bg-[#1C1C1A] text-white border-[#2F2F2C] shadow-sm hover:border-[#D7FF64]/40'
                  : 'bg-[#FFFFFF] border-[#E6E4DE] text-[#171717] shadow-2xs hover:border-[#171717]/40 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span
                    className={`text-xs font-medium ${
                      m.accent ? 'text-[#AAAAAA]' : 'text-[#777777]'
                    }`}
                  >
                    {m.label}
                  </span>
                  <div
                    className={`p-1.5 rounded-lg ${
                      m.accent
                        ? 'bg-[#2A2A28] text-[#D7FF64]'
                        : 'bg-[#F7F6F2] text-[#171717]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div
                  className={`text-2xl font-editorial-mono font-bold tracking-tight ${
                    m.accent ? 'text-[#D7FF64]' : 'text-[#171717]'
                  }`}
                >
                  {m.value}
                </div>
              </div>

              <div
                className={`pt-3 mt-3 border-t flex items-center justify-between ${
                  m.accent ? 'border-[#2E2E2A]' : 'border-[#F2EFE9]'
                }`}
              >
                <span
                  className={`text-xs truncate ${
                    m.accent ? 'text-[#888888]' : 'text-[#777777]'
                  }`}
                >
                  {m.subtext}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 font-medium ${
                    m.accent
                      ? 'bg-[#2A2A28] text-[#D7FF64]'
                      : 'bg-[#EBF7EE] text-[#23784F]'
                  }`}
                >
                  {m.badge}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Expandable secondary metrics */}
      {showSecondary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-fade-in">
          {secondaryMetrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <Link
                key={idx}
                href={m.link}
                className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#FFFFFF] hover:border-[#171717]/30 transition-all flex items-center justify-between shadow-2xs"
              >
                <div>
                  <span className="text-xs text-[#777777] font-medium block mb-1">
                    {m.label}
                  </span>
                  <div className="text-lg font-editorial-mono font-bold text-[#171717]">
                    {m.value}
                  </div>
                  <span className="text-[11px] text-[#777777] block mt-0.5">
                    {m.subtext}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-[#FFFFFF] border border-[#E6E4DE] text-[#555555]">
                  <Icon className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
