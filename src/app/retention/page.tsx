'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  ShieldAlert,
  Clock,
  DollarSign,
  TrendingDown,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function RetentionPage() {
  const { clientClosures, clients, users } = useAgencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalClosed = clientClosures.length;
  const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'onboarding').length;
  const totalLifecycleClients = activeClients + totalClosed;

  const retentionRate = totalLifecycleClients > 0
    ? Math.round((activeClients / totalLifecycleClients) * 100)
    : 85;

  const churnRate = 100 - retentionRate;

  const totalRevenueLost = clientClosures.reduce((acc, c) => acc + (c.annual_revenue_lost || 0), 0);

  const avgDurationDays = totalClosed > 0
    ? Math.round(clientClosures.reduce((acc, c) => acc + (c.relationship_duration_days || 0), 0) / totalClosed)
    : 160;

  // 1. Loss Reasons by Frequency
  const lossReasonCounts: Record<string, { count: number; revenue: number }> = {};
  clientClosures.forEach((c) => {
    const reason = c.primary_loss_reason;
    if (!lossReasonCounts[reason]) {
      lossReasonCounts[reason] = { count: 0, revenue: 0 };
    }
    lossReasonCounts[reason].count += 1;
    lossReasonCounts[reason].revenue += c.annual_revenue_lost;
  });

  const lossReasonChartData = Object.entries(lossReasonCounts).map(([reason, data]) => ({
    reason,
    count: data.count,
    revenue: data.revenue,
  }));

  const COLORS = ['#1C1C1A', '#E5484D', '#B7791F', '#555555', '#D7FF64'];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#E5484D] font-semibold">
                Strategic Intelligence Differentiator
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">Empirical Churn Analysis</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Client Retention Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Diagnose why clients churn, distinguish verified client feedback from internal assumptions, and track recovery win-back cycles.
            </p>
          </div>
        </div>

        {/* Pulse Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Client Retention Rate</span>
            <span className="text-xl font-bold font-editorial-mono text-[#23784F] mt-0.5 block">
              {retentionRate}%
            </span>
            <span className="text-[9px] text-[#777777]">Benchmark &gt;80%</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Client Churn Rate</span>
            <span className="text-xl font-bold font-editorial-mono text-[#E5484D] mt-0.5 block">
              {churnRate}%
            </span>
            <span className="text-[9px] text-[#777777]">Calculated over lifecycle</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Annualized Revenue Lost</span>
            <span className="text-xl font-bold font-editorial-mono text-[#171717] mt-0.5 block">
              {formatCurrency(totalRevenueLost)}
            </span>
            <span className="text-[9px] text-[#777777]">From {totalClosed} closed accounts</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Avg Relationship Duration</span>
            <span className="text-xl font-bold font-editorial-mono text-[#171717] mt-0.5 block">
              {Math.round(avgDurationDays / 30)} Months
            </span>
            <span className="text-[9px] text-[#777777]">~{avgDurationDays} days tenure</span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#2F2F2C] bg-[#1C1C1A] text-white shadow-2xs">
            <span className="text-[10px] font-mono text-[#A3A29E] uppercase block">Win-Back Pipeline</span>
            <span className="text-xl font-bold font-editorial-mono text-[#D7FF64] mt-0.5 block">
              {clientClosures.filter((c) => c.recovery_opportunity === 'High').length} High Potential
            </span>
            <span className="text-[9px] text-[#A3A29E]">Identified recovery targets</span>
          </div>
        </div>

        {/* Charts: Root Causes by Frequency and Lost Revenue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Chart 1: Loss Reasons by Frequency */}
          <div className="lg:col-span-6 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#171717]">
                Primary Loss Reasons by Frequency
              </h3>
              <p className="text-xs text-[#777777]">
                Empirically validated distribution of exit triggers
              </p>
            </div>

            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossReasonChartData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE4" horizontal={false} />
                    <XAxis type="number" stroke="#999999" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="reason" stroke="#171717" fontSize={10} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Client Exit${Number(val) === 1 ? '' : 's'}`, 'Count']}
                      contentStyle={{ background: '#1C1C1A', borderColor: '#2F2F2C', color: '#FFFFFF', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#1C1C1A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#777777]">Loading chart...</div>
              )}
            </div>
          </div>

          {/* Chart 2: Loss Reasons by Revenue Impact */}
          <div className="lg:col-span-6 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#171717]">
                Revenue Impact by Loss Reason (₹)
              </h3>
              <p className="text-xs text-[#777777]">
                Quantified annualized agency revenue destroyed per root cause
              </p>
            </div>

            <div className="h-64 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lossReasonChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE4" vertical={false} />
                    <XAxis dataKey="reason" stroke="#999999" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#999999" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Annual Lost Revenue']}
                      contentStyle={{ background: '#1C1C1A', borderColor: '#2F2F2C', color: '#FFFFFF', fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar dataKey="revenue" fill="#E5484D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#777777]">Loading chart...</div>
              )}
            </div>
          </div>
        </div>

        {/* Structured Exit Records & Verbatim Feedback Table */}
        <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono uppercase text-[#777777] font-semibold">
                Structured Client Offboarding Registry
              </h3>
              <p className="text-xs text-[#555555]">
                Complete post-mortem documentation with verbatim client remarks and win-back opportunities
              </p>
            </div>
            <span className="text-xs font-mono text-[#777777]">{clientClosures.length} Recorded Exits</span>
          </div>

          <div className="divide-y divide-[#E6E4DE]">
            {clientClosures.map((closure) => (
              <div key={closure.id} className="p-4 space-y-3 hover:bg-[#FDFDFB] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#171717]">{closure.client_name}</span>
                    <Badge variant="destructive">{closure.primary_loss_reason}</Badge>
                    {closure.secondary_loss_reason && (
                      <Badge variant="outline">{closure.secondary_loss_reason}</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#777777]">Lost: {formatDate(closure.closure_date)}</span>
                    <span className="text-[#D1CFC7]">•</span>
                    <span className="font-bold text-[#E5484D]">{formatCurrency(closure.annual_revenue_lost)}/yr</span>
                  </div>
                </div>

                {/* Evidence Integrity Tag */}
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      closure.is_confirmed_feedback
                        ? 'bg-[#EBF8F2] text-[#23784F]'
                        : 'bg-[#FFF8E6] text-[#B7791F]'
                    }`}
                  >
                    {closure.is_confirmed_feedback ? '✓ Verified Client Direct Feedback' : '⚠️ Internal Studio Assumption'}
                  </span>
                  <span className="text-[#777777]">Account Director at Exit: {closure.account_manager_name}</span>
                  <span className="text-[#777777]">• Duration: {closure.relationship_duration_days} days</span>
                </div>

                {/* Verbatim Feedback Block */}
                {closure.client_feedback_verbatim && (
                  <div className="p-3 rounded-lg bg-[#FAFAF8] border border-[#E6E4DE] text-xs">
                    <span className="text-[10px] font-mono uppercase text-[#777777] block mb-1">
                      Client Verbatim Statement:
                    </span>
                    <p className="italic text-[#171717]">"{closure.client_feedback_verbatim}"</p>
                  </div>
                )}

                {/* Internal Root Cause */}
                <p className="text-xs text-[#555555] leading-relaxed">
                  <strong>Internal Post-Mortem:</strong> {closure.detailed_explanation}
                </p>

                {/* Recovery / Winback Strip */}
                {closure.recovery_opportunity !== 'None' && (
                  <div className="pt-2 border-t border-[#ECEAE4] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#30A46C] flex items-center gap-1 font-semibold">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Recovery Opportunity: {closure.recovery_opportunity}
                    </span>
                    {closure.recovery_follow_up_date && (
                      <span className="text-[#777777]">
                        Target Re-Engagement: {formatDate(closure.recovery_follow_up_date)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
