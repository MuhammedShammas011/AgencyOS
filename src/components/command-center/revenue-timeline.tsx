'use client';

import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C1C1A] text-white p-3 rounded-lg shadow-xl border border-[#2E2E2B] text-xs">
        <p className="font-mono text-[#D7FF64] mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="text-[#AAAAAA]">{entry.name}:</span>
              <span className="font-mono font-semibold" style={{ color: entry.color }}>
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function RevenueTimeline() {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const monthlyData = [
    { period: 'May', collected: 850000, expenses: 240000, profit: 610000 },
    { period: 'Jun', collected: 950000, expenses: 310000, profit: 640000 },
    { period: 'Jul', collected: 1300000, expenses: 390000, profit: 910000 },
    { period: 'Aug', collected: 1520000, expenses: 440000, profit: 1080000 },
    { period: 'Sep', collected: 1680000, expenses: 490000, profit: 1190000 },
    { period: 'Oct', collected: 1840000, expenses: 510000, profit: 1330000 },
  ];

  const weeklyData = [
    { period: 'W1 Sep', collected: 300000, expenses: 95000, profit: 205000 },
    { period: 'W2 Sep', collected: 400000, expenses: 110000, profit: 290000 },
    { period: 'W3 Sep', collected: 450000, expenses: 130000, profit: 320000 },
    { period: 'W4 Sep', collected: 530000, expenses: 155000, profit: 375000 },
    { period: 'W1 Oct', collected: 420000, expenses: 120000, profit: 300000 },
    { period: 'W2 Oct', collected: 550000, expenses: 145000, profit: 405000 },
  ];

  const chartData = viewMode === 'monthly' ? monthlyData : weeklyData;

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
              Cash Flow & Expenses
            </h3>
            <span className="text-[11px] font-mono text-[#23784F] bg-[#EBF7EE] px-1.5 py-0.5 rounded font-medium">
              +14% realization
            </span>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Realized cash collections versus direct studio operating expenditures
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE9] rounded-lg border border-[#E6E4DE]">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              WEEKLY
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                  : 'text-[#777777] hover:text-[#171717]'
              }`}
            >
              MONTHLY
            </button>
          </div>

          <Link
            href="/financials"
            className="text-xs font-mono text-[#777777] hover:text-[#171717] hidden sm:flex items-center gap-1 transition-colors"
          >
            <span>Financials</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-64 w-full pt-1">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D7FF64" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#D7FF64" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE4" vertical={false} />
              <XAxis
                dataKey="period"
                stroke="#999999"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#999999"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatCompactNumber(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              />
              <Area
                type="monotone"
                name="Cash Collected"
                dataKey="collected"
                stroke="#171717"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCollected)"
              />
              <Area
                type="monotone"
                name="Studio Expenses"
                dataKey="expenses"
                stroke="#E5484D"
                strokeWidth={2}
                fill="none"
              />
              <Area
                type="monotone"
                name="Net Profit"
                dataKey="profit"
                stroke="#23784F"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[#777777]">
            Loading cash flow...
          </div>
        )}
      </div>
    </div>
  );
}
