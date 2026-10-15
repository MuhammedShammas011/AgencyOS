'use client';

import React, { useState, useEffect } from 'react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export function AcquisitionAnalytics() {
  const { leads, clients } = useAgencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Leads and Revenue by Channel
  const channels = ['Instagram', 'Website', 'Referral', 'Meta Ads', 'Networking', 'Google Search'];

  const channelStats = channels.map((ch) => {
    const channelLeads = leads.filter((l) => l.acquisition_source === ch);
    const wonLeads = channelLeads.filter((l) => l.stage === 'won');
    const totalPotential = channelLeads.reduce((acc, l) => acc + (l.estimated_deal_value || 0), 0);
    const conversionRate = channelLeads.length > 0 ? Math.round((wonLeads.length / channelLeads.length) * 100) : 0;

    // Direct revenue from converted clients
    const convertedClients = clients.filter((c) => c.acquisition_source_name?.includes(ch));
    const realizedRevenue = convertedClients.reduce((acc, c) => acc + c.lifetime_value, 0);

    return {
      channel: ch,
      leadCount: channelLeads.length,
      wonCount: wonLeads.length,
      conversionRate,
      potentialVolume: totalPotential,
      realizedRevenue,
    };
  });

  // 2. Referrers attribution
  const referrers = leads
    .filter((l) => Boolean(l.referring_person))
    .map((l) => ({
      person: l.referring_person!,
      company: l.company,
      value: l.estimated_deal_value,
      stage: l.stage,
    }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Revenue by Acquisition Channel */}
        <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">
              Pipeline Value by Inbound Channel
            </h3>
            <p className="text-xs text-[#777777]">
              Total deal volume generated across channels
            </p>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE4" vertical={false} />
                  <XAxis dataKey="channel" stroke="#999999" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#999999" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Pipeline Value']}
                    contentStyle={{
                      background: '#1C1C1A',
                      borderColor: '#2F2F2C',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="potentialVolume" fill="#171717" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#777777]">
                Rendering chart...
              </div>
            )}
          </div>
        </div>

        {/* Channel Conversion Metrics Table */}
        <div className="lg:col-span-5 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
          <h3 className="text-sm font-semibold text-[#171717]">
            Channel Conversion Efficiency
          </h3>
          <p className="text-xs text-[#777777]">Empirical conversion ratios by channel</p>

          <div className="divide-y divide-[#E6E4DE]">
            {channelStats.map((cs) => (
              <div key={cs.channel} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#171717]">{cs.channel}</div>
                  <div className="text-[11px] text-[#777777] font-mono">
                    {cs.leadCount} inquiries • {cs.wonCount} won
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-[#171717]">{cs.conversionRate}%</div>
                  <div className="text-[10px] text-[#30A46C]">{formatCompactNumber(cs.realizedRevenue)} LTV</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referring Individuals Attribution */}
      <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
        <h3 className="text-sm font-semibold text-[#171717]">
          Personal Referral Attribution Network
        </h3>
        <p className="text-xs text-[#777777]">
          Distinct tracking of individual advocates and introducers separate from aggregate channels
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {referrers.map((ref, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] space-y-1">
              <div className="text-[10px] font-mono uppercase text-[#777777]">Introduced by</div>
              <div className="text-xs font-semibold text-[#171717]">{ref.person}</div>
              <div className="text-[11px] text-[#555555]">
                Prospect: <strong className="text-[#171717]">{ref.company}</strong> ({formatCurrency(ref.value)})
              </div>
              <div className="text-[10px] font-mono text-[#30A46C] pt-1">
                Status: {ref.stage.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
