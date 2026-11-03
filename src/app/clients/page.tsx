'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { Search, Plus } from 'lucide-react';
import { formatCurrency, formatDate, isPastDate } from '@/lib/utils';
import { Client } from '@/lib/types';

function getPaymentStatus(client: Client): 'paid' | 'pending' | 'overdue' {
  const agreedAmount = client.agreed_amount ?? client.project_value ?? 0;
  const paid = client.total_paid ?? 0;

  if (paid >= agreedAmount && agreedAmount > 0) return 'paid';
  if (client.payment_due_date && isPastDate(client.payment_due_date)) return 'overdue';
  return 'pending';
}

const statusConfig = {
  paid: { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  overdue: { label: 'Overdue', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ClientsPage() {
  const { clients } = useAgencyStore();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.company.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.account_manager_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients.length} total</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
        />
      </div>

      {/* Client Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          {search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Handler</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Due Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((client) => {
                const payStatus = getPaymentStatus(client);
                const cfg = statusConfig[payStatus];
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <Link href={`/clients/${client.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                            {client.company.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{client.company}</div>
                            <div className="text-xs text-gray-400">{client.name}</div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <Link href={`/clients/${client.id}`} className="block">
                        <div className="text-sm text-gray-600">{client.name}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <Link href={`/clients/${client.id}`} className="block">
                        <div className="text-sm text-gray-600">{client.account_manager_name || '—'}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <Link href={`/clients/${client.id}`} className="block">
                        <div className="text-sm text-gray-600">{formatDate(client.payment_due_date) || '—'}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/clients/${client.id}`} className="block">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ClientFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </AppShell>
  );
}
