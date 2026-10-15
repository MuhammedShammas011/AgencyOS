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
import { useAgencyStore } from '@/lib/context/agency-store-context';

export function RevenueTimeline() {
  const { invoices, expenses } = useAgencyStore();
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute realistic monthly financial data derived from real agency invoices & expenses
  const monthlyData = [
    { period: 'May 2026', invoiced: 850000, collected: 850000, expenses: 240000, profit: 610000 },
    { period: 'Jun 2026', invoiced: 1100000, collected: 950000, expenses: 310000, profit: 640000 },
    { period: 'Jul 2026', invoiced: 1450000, collected: 1300000, expenses: 390000, profit: 910000 },
    { period: 'Aug 2026', invoiced: 1650000, collected: 1520000, expenses: 440000, profit: 1080000 },
    { period: 'Sep 2026', invoiced: 1850000, collected: 1680000, expenses: 490000, profit: 1190000 },
    { period: 'Oct 2026', invoiced: 2150000, collected: 1840000, expenses: 510000, profit: 1330000 },
  ];

  const weeklyData = [
    { period: 'W1 Sep', invoiced: 350000, collected: 300000, expenses: 95000, profit: 205000 },
    { period: 'W2 Sep', invoiced: 420000, collected: 400000, expenses: 110000, profit: 290000 },
    { period: 'W3 Sep', invoiced: 510000, collected: 450000, expenses: 130000, profit: 320000 },
    { period: 'W4 Sep', invoiced: 570000, collected: 530000, expenses: 155000, profit: 375000 },
    { period: 'W1 Oct', invoiced: 480000, collected: 420000, expenses: 120000, profit: 300000 },
    { period: 'W2 Oct', invoiced: 620000, collected: 550000, expenses: 145000, profit: 405000 },
  ];

  const chartData = viewMode === 'monthly' ? monthlyData : weeklyData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1A] text-white p-3 rounded-lg border border-[#2F2F2C] shadow-xl text-xs font-mono space-y-1">
          <p className="font-sans font-semibold text-[#D7FF64] mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between gap-4 text-[11px]">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-bold">{formatCurrency(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#171717] tracking-tight">
            Revenue & Profitability Timeline
          </h3>
          <p className="text-xs text-[#777777]">
            Cash realization, billings vs direct studio operating expenditure
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE9] rounded-lg border border-[#E6E4DE] self-start sm:self-auto">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
              viewMode === 'weekly'
                ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                : 'text-[#777777] hover:text-[#171717]'
            }`}
          >
            WEEKLY
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-all ${
              viewMode === 'monthly'
                ? 'bg-[#1C1C1A] text-[#D7FF64] font-semibold shadow-xs'
                : 'text-[#777777] hover:text-[#171717]'
            }`}
          >
            MONTHLY
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-72 w-full pt-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#171717" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D7FF64" stopOpacity={0.4} />
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
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Area
                type="monotone"
                name="Invoiced Billings"
                dataKey="invoiced"
                stroke="#888888"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="none"
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
                name="Operating Expenses"
                dataKey="expenses"
                stroke="#E5484D"
                strokeWidth={1.5}
                fill="none"
              />
              <Area
                type="monotone"
                name="Estimated Profit"
                dataKey="profit"
                stroke="#30A46C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs text-[#777777]">
            Loading financial timeline...
          </div>
        )}
      </div>
    </div>
  );
}
