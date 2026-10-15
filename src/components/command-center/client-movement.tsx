'use client';

import React from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ArrowRight, UserPlus, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export function ClientMovement() {
  const { clients, leads, proposals, clientClosures } = useAgencyStore();

  const activeLeads = leads.filter((l) => l.stage !== 'won' && l.stage !== 'lost');
  const leadsPipelineValue = activeLeads.reduce((acc, l) => acc + (l.estimated_deal_value || 0), 0);

  const pendingProposals = proposals.filter((p) => p.status === 'sent' || p.status === 'viewed' || p.status === 'negotiation');
  const proposalsValue = pendingProposals.reduce((acc, p) => acc + (p.total_quoted_value || 0), 0);

  const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'onboarding');
  const activeMrr = activeClients.reduce((acc, c) => acc + (c.monthly_retainer || 0), 0);

  const retainedClientsCount = clients.filter((c) => c.status === 'active').length;
  const churnedCount = clientClosures.length;
  const retentionPercent = retainedClientsCount + churnedCount > 0
    ? Math.round((retainedClientsCount / (retainedClientsCount + churnedCount)) * 100)
    : 92;

  const funnelStages = [
    {
      title: 'Inbound Leads',
      count: activeLeads.length,
      metric: formatCurrency(leadsPipelineValue),
      metricLabel: 'Pipeline Value',
      icon: UserPlus,
      link: '/acquisition',
      color: 'border-l-[#171717]',
    },
    {
      title: 'Proposals Out',
      count: pendingProposals.length,
      metric: formatCurrency(proposalsValue),
      metricLabel: 'Under Decision',
      icon: FileText,
      link: '/proposals',
      color: 'border-l-[#555555]',
    },
    {
      title: 'Active Clients',
      count: activeClients.length,
      metric: `${formatCurrency(activeMrr)}/mo`,
      metricLabel: 'Retainer Volume',
      icon: CheckCircle2,
      link: '/clients',
      color: 'border-l-[#1C1C1A]',
    },
    {
      title: 'Client Retention',
      count: `${retentionPercent}%`,
      metric: `${retainedClientsCount} Active • ${churnedCount} Exit`,
      metricLabel: 'Studio Stability',
      icon: ShieldCheck,
      link: '/retention',
      color: 'border-l-[#23784F]',
    },
  ];

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
            Client Lifecycle Funnel
          </h3>
          <p className="text-xs text-[#777777]">
            Conversion velocity from lead discovery to long-term retained relationships
          </p>
        </div>
        <Link
          href="/clients"
          className="text-xs font-mono text-[#777777] hover:text-[#171717] flex items-center gap-1 transition-colors"
        >
          <span>Client Universe</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 4 Clean Funnel Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {funnelStages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <Link
              key={idx}
              href={stage.link}
              className={`p-3.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] hover:bg-[#FFFFFF] hover:border-[#171717]/40 transition-all group flex flex-col justify-between border-l-4 ${stage.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[#777777]">
                  {stage.title}
                </span>
                <Icon className="w-3.5 h-3.5 text-[#999999] group-hover:text-[#171717] transition-colors" />
              </div>

              <div>
                <div className="text-xl font-editorial-mono font-bold text-[#171717]">
                  {stage.count}
                </div>
                <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#E6E4DE]/60 text-[11px]">
                  <span className="text-[#888888]">{stage.metricLabel}:</span>
                  <span className="font-mono font-medium text-[#171717]">
                    {stage.metric}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
