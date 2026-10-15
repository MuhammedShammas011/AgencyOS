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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export function ProfitabilityCharts() {
  const { clients, invoices, expenses } = useAgencyStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Profitability by Client (Actual revenue collected minus direct client expenses)
  const clientProfitability = clients.map((c) => {
    const clientInvoices = invoices.filter((i) => i.client_id === c.id);
    const revenueCollected = clientInvoices.reduce((acc, i) => acc + i.amount_paid, 0);

    const clientExpenses = expenses.filter((e) => e.client_id === c.id);
    const directExpenses = clientExpenses.reduce((acc, e) => acc + e.amount, 0);

    const grossProfit = revenueCollected - directExpenses;
    const margin = revenueCollected > 0 ? Math.round((grossProfit / revenueCollected) * 100) : 0;

    return {
      clientName: c.name,
      revenueCollected,
      directExpenses,
      grossProfit,
      margin,
    };
  });

  // 2. Expense Breakdown by Category
  const expenseCategories = [
    'Production & Equipment',
    'Freelancer & Contractor',
    'Software & AI Tools',
    'Media Buying & Ad Spend',
    'Travel & Client Hospitality',
  ];

  const expenseBreakdown = expenseCategories.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((acc, e) => acc + e.amount, 0);
    return { name: cat, value: total };
  });

  const COLORS = ['#171717', '#444444', '#777777', '#B7791F', '#D7FF64'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Client Profitability Chart */}
        <div className="lg:col-span-7 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#171717]">
              Gross Profitability by Account
            </h3>
            <p className="text-xs text-[#777777]">
              Cash collected minus direct vendor & production disbursements
            </p>
          </div>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clientProfitability} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ECEAE4" vertical={false} />
                  <XAxis dataKey="clientName" stroke="#999999" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#999999" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => formatCompactNumber(v)} />
                  <Tooltip
                    formatter={(value: any, name: any) => [formatCurrency(Number(value)), name === 'revenueCollected' ? 'Collected Revenue' : 'Est. Gross Profit']}
                    contentStyle={{
                      background: '#1C1C1A',
                      borderColor: '#2F2F2C',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenueCollected" name="revenueCollected" fill="#171717" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossProfit" name="grossProfit" fill="#D7FF64" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#777777]">
                Rendering chart...
              </div>
            )}
          </div>
        </div>

        {/* Expense Category Pie Breakdown */}
        <div className="lg:col-span-5 bg-[#FFFFFF] p-5 rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
          <h3 className="text-sm font-semibold text-[#171717]">
            Operating Expense Allocations
          </h3>
          <p className="text-xs text-[#777777]">
            Vendor payouts, media spend, equipment & software overhead
          </p>

          <div className="h-64 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Expense']}
                    contentStyle={{
                      background: '#1C1C1A',
                      borderColor: '#2F2F2C',
                      color: '#FFFFFF',
                      fontSize: '11px',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#777777]">
                Rendering chart...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Gross Margin Table */}
      <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-[#E6E4DE] bg-[#FAFAF8]">
          <h3 className="text-xs font-mono uppercase text-[#777777] font-semibold">
            Account Profitability Contribution Margin Ledger
          </h3>
        </div>
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[10px] text-[#777777]">
            <tr>
              <th className="px-4 py-2.5 font-sans">Client Account</th>
              <th className="px-4 py-2.5 text-right">Cash Received</th>
              <th className="px-4 py-2.5 text-right">Direct Expenses</th>
              <th className="px-4 py-2.5 text-right">Gross Profit</th>
              <th className="px-4 py-2.5 text-right">Margin %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4DE]">
            {clientProfitability.map((cp, idx) => (
              <tr key={idx} className="hover:bg-[#F7F6F2]">
                <td className="px-4 py-2.5 font-sans font-semibold text-[#171717]">{cp.clientName}</td>
                <td className="px-4 py-2.5 text-right">{formatCurrency(cp.revenueCollected)}</td>
                <td className="px-4 py-2.5 text-right text-[#777777]">{formatCurrency(cp.directExpenses)}</td>
                <td className="px-4 py-2.5 text-right font-bold text-[#171717]">{formatCurrency(cp.grossProfit)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`px-2 py-0.5 rounded font-bold ${cp.margin >= 60 ? 'bg-[#EBF8F2] text-[#23784F]' : 'bg-[#FFF8E6] text-[#B7791F]'}`}>
                    {cp.margin}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
