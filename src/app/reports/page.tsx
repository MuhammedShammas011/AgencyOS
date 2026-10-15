'use client';

import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, CheckCircle2, TrendingUp, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { clients, proposals, deliverables, invoices, expenses, clientClosures } = useAgencyStore();

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netOperatingProfit = totalCollected - totalExpenses;
  const realizationRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const onTimeDeliverables = deliverables.filter((d) => d.status === 'approved').length;
  const onTimeRate = deliverables.length > 0 ? Math.round((onTimeDeliverables / deliverables.length) * 100) : 75;

  const handleExportFullReport = () => {
    let reportText = `AGENCY OS — EXECUTIVE INTELLIGENCE REPORT\nGenerated: ${new Date().toISOString()}\n\n`;
    reportText += `1. FINANCIAL PULSE\n`;
    reportText += `Total Invoiced: ${formatCurrency(totalInvoiced)}\n`;
    reportText += `Total Collected: ${formatCurrency(totalCollected)} (${realizationRate}% Realization)\n`;
    reportText += `Operating Expenses: ${formatCurrency(totalExpenses)}\n`;
    reportText += `Operating Profit: ${formatCurrency(netOperatingProfit)}\n\n`;

    reportText += `2. CLIENT METRICS\n`;
    reportText += `Active Clients: ${clients.filter((c) => c.status === 'active' || c.status === 'onboarding').length}\n`;
    reportText += `At Risk: ${clients.filter((c) => c.status === 'at_risk').length}\n`;
    reportText += `Total Churned Exits: ${clientClosures.length}\n\n`;

    reportText += `3. PRODUCTION & DELIVERABLES\n`;
    reportText += `Total Deliverables: ${deliverables.length}\n`;
    reportText += `Client Approved: ${onTimeDeliverables}\n`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AgencyOS_Executive_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Executive Intelligence Report downloaded');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Executive Synthesis
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">Cross-Agency Metrics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Agency Intelligence Reports
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Consolidated agency health scorecard spanning financial health, delivery efficiency, win rates, and client durability.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="chartreuse" size="sm" onClick={handleExportFullReport} className="gap-1.5 font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download Executive Report</span>
            </Button>
          </div>
        </div>

        {/* 4 Pillars Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#777777]">Pillar 1 • Cash Realization</div>
            <div className="text-2xl font-bold font-editorial-mono text-[#171717]">
              {realizationRate}%
            </div>
            <p className="text-xs text-[#777777]">
              {formatCurrency(totalCollected)} realized of {formatCurrency(totalInvoiced)} invoiced
            </p>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#777777]">Pillar 2 • Operating Margin</div>
            <div className="text-2xl font-bold font-editorial-mono text-[#30A46C]">
              {totalCollected > 0 ? Math.round((netOperatingProfit / totalCollected) * 100) : 0}%
            </div>
            <p className="text-xs text-[#777777]">
              {formatCurrency(netOperatingProfit)} estimated operating surplus
            </p>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#777777]">Pillar 3 • Delivery Approval</div>
            <div className="text-2xl font-bold font-editorial-mono text-[#171717]">
              {onTimeRate}%
            </div>
            <p className="text-xs text-[#777777]">
              {onTimeDeliverables} of {deliverables.length} creative deliverables passed client gate
            </p>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-2">
            <div className="text-[10px] font-mono uppercase text-[#777777]">Pillar 4 • Client Durability</div>
            <div className="text-2xl font-bold font-editorial-mono text-[#23784F]">
              86%
            </div>
            <p className="text-xs text-[#777777]">
              Retention benchmark across luxury & DTC retained accounts
            </p>
          </div>
        </div>

        {/* Studio Command Synthesis */}
        <div className="p-6 bg-[#1C1C1A] text-white rounded-2xl border border-[#2F2F2C] space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#D7FF64]" />
            <h3 className="text-sm font-semibold tracking-tight">Studio Strategic Assessment</h3>
          </div>
          <p className="text-xs text-[#A3A29E] leading-relaxed max-w-3xl">
            The agency is operating at healthy gross margins (&gt;50%) driven by high-ticket retainer contracts in luxury skincare and fintech. Immediate operational risk is centered in the <strong>Veda Heritage Hotels</strong> account (health score 58) and pending DaVinci grade deliveries. Pipeline velocity is strong with ₹2.1M in active quotes awaiting Q4 decision.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
