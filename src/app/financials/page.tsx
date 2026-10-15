'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ReceivablesAging } from '@/components/financials/receivables-aging';
import { ProfitabilityCharts } from '@/components/financials/profitability-charts';
import { InvoiceFormModal } from '@/components/financials/invoice-form-modal';
import { ExpenseFormModal } from '@/components/financials/expense-form-modal';
import { PaymentRecordModal } from '@/components/financials/payment-record-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  Plus,
  Download,
  CreditCard,
  Receipt,
  PieChart,
  Clock,
  TrendingUp,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialsPage() {
  const { invoices, expenses, clients, currentRole } = useAgencyStore();

  const [activeTab, setActiveTab] = useState<'invoices' | 'aging' | 'expenses' | 'profitability'>('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null);

  // Role restriction check for execution team
  if (currentRole === 'creative') {
    return (
      <AppShell>
        <div className="py-24 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F2EFE9] text-[#777777] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-[#171717]">Financial Ledger Access Restricted</h2>
          <p className="text-xs text-[#777777]">
            Your current simulated role is <strong>Creative / Execution Team</strong>. Access to financial billings, receivables aging, and profit margins is restricted to Management, Finance, and Administrators.
          </p>
          <p className="text-[11px] text-[#999999]">
            Tip: Use the top-right Role Switcher to simulate <strong>Finance</strong> or <strong>Administrator</strong>.
          </p>
        </div>
      </AppShell>
    );
  }

  // Financial aggregates
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.total_amount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amount_paid, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + i.outstanding_amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const estimatedProfit = totalCollected - totalExpenses;

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'invoices' || activeTab === 'aging') {
      csvContent += 'Invoice Number,Client,Issue Date,Due Date,Total Amount,Amount Paid,Outstanding,Status\n';
      invoices.forEach((i) => {
        csvContent += `${i.invoice_number},"${i.client_name}",${i.issue_date},${i.due_date},${i.total_amount},${i.amount_paid},${i.outstanding_amount},${i.status}\n`;
      });
    } else {
      csvContent += 'Expense Title,Category,Vendor,Date,Amount,Client\n';
      expenses.forEach((e) => {
        csvContent += `"${e.title}","${e.category}","${e.vendor}",${e.expense_date},${e.amount},"${e.client_name || 'N/A'}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agency_os_${activeTab}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Financial report exported to CSV');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Financial Operations & Margins
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">Strict Accounting Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Financial Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Separate invoiced billings, actual cash collected, aging receivables, and unit gross margins.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsExpenseModalOpen(true)} className="gap-1.5 text-xs">
              <Receipt className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </Button>
            <Button variant="chartreuse" size="sm" onClick={() => setIsInvoiceModalOpen(true)} className="gap-1.5 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Issue Invoice</span>
            </Button>
          </div>
        </div>

        {/* Financial Pulse Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Invoiced Billings</span>
            <span className="text-lg font-bold font-editorial-mono text-[#171717] mt-0.5 block">
              {formatCurrency(totalInvoiced)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Cash Realized</span>
            <span className="text-lg font-bold font-editorial-mono text-[#30A46C] mt-0.5 block">
              {formatCurrency(totalCollected)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Aging Receivables</span>
            <span className="text-lg font-bold font-editorial-mono text-[#E5484D] mt-0.5 block">
              {formatCurrency(totalOutstanding)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#E6E4DE] bg-[#FFFFFF] shadow-2xs">
            <span className="text-[10px] font-mono text-[#777777] uppercase block">Direct Studio Expenses</span>
            <span className="text-lg font-bold font-editorial-mono text-[#777777] mt-0.5 block">
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-[#2F2F2C] bg-[#1C1C1A] text-white shadow-2xs">
            <span className="text-[10px] font-mono text-[#A3A29E] uppercase block">Est. Operating Profit</span>
            <span className="text-lg font-bold font-editorial-mono text-[#D7FF64] mt-0.5 block">
              {formatCurrency(estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs overflow-x-auto">
          {[
            { id: 'invoices', label: `Invoices Ledger (${invoices.length})` },
            { id: 'aging', label: 'Receivables Aging Schedule' },
            { id: 'expenses', label: `Operating Expenses (${expenses.length})` },
            { id: 'profitability', label: 'Unit Economics & Margins' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                  : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Views */}
        <div>
          {/* TAB 1: INVOICES LEDGER */}
          {activeTab === 'invoices' && (
            <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Issue Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Total Amount</th>
                    <th className="px-4 py-3 text-right">Amount Paid</th>
                    <th className="px-4 py-3 text-right">Outstanding</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DE]">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === 'paid';
                    return (
                      <tr key={inv.id} className="hover:bg-[#F7F6F2] transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-[#171717]">
                          {inv.invoice_number}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-[#171717]">{inv.client_name}</div>
                          {inv.project_name && (
                            <div className="text-[11px] text-[#777777]">{inv.project_name}</div>
                          )}
                        </td>

                        <td className="px-4 py-3 font-mono text-[#777777]">{formatDate(inv.issue_date)}</td>
                        <td className="px-4 py-3 font-mono text-[#777777]">{formatDate(inv.due_date)}</td>

                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#171717]">
                          {formatCurrency(inv.total_amount)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#30A46C]">
                          {formatCurrency(inv.amount_paid)}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-[#E5484D]">
                          {formatCurrency(inv.outstanding_amount)}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              isPaid
                                ? 'success'
                                : inv.status === 'partially_paid'
                                ? 'warning'
                                : inv.status === 'overdue'
                                ? 'destructive'
                                : 'default'
                            }
                          >
                            {inv.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {!isPaid && (
                            <Button
                              variant="chartreuse"
                              size="sm"
                              onClick={() => setPaymentTargetInvoice(inv)}
                              className="text-[11px] h-7 px-2.5 font-semibold"
                            >
                              Record Payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: RECEIVABLES AGING */}
          {activeTab === 'aging' && (
            <ReceivablesAging onRecordPayment={(inv) => setPaymentTargetInvoice(inv)} />
          )}

          {/* TAB 3: OPERATING EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
                  <tr>
                    <th className="px-4 py-3">Expense Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Vendor</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Client Allocation</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E4DE]">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F7F6F2] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#171717]">{exp.title}</td>
                      <td className="px-4 py-3 text-[#555555]">
                        <span className="px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#E6E4DE] text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">{exp.vendor}</td>
                      <td className="px-4 py-3 font-mono text-[#777777]">{formatDate(exp.expense_date)}</td>
                      <td className="px-4 py-3 text-[#171717] font-medium">{exp.client_name || 'Studio Overhead'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-[#171717]">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 4: PROFITABILITY CHARTS */}
          {activeTab === 'profitability' && <ProfitabilityCharts />}
        </div>
      </div>

      {/* Modals */}
      <InvoiceFormModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
      <PaymentRecordModal
        invoice={paymentTargetInvoice}
        onClose={() => setPaymentTargetInvoice(null)}
      />
    </AppShell>
  );
}
