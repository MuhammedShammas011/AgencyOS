'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { Search, Plus, Calendar, UserCheck } from 'lucide-react';
import { formatDate, isPastDate } from '@/lib/utils';
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
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">Clients</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{clients.length} total client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
        />
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-xl border border-gray-100 p-8">
          {search ? 'No clients match your search.' : 'No clients yet. Add your first client.'}
        </div>
      ) : (
        <>
          {/* Mobile Card View (< sm) */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((client) => {
              const payStatus = getPaymentStatus(client);
              const cfg = statusConfig[payStatus];

              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0">
                        {client.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{client.company}</div>
                        <div className="text-xs text-gray-400 truncate">{client.name}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border shrink-0 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{client.account_manager_name || 'Unassigned'}</span>
                    </div>
                    {client.payment_due_date && (
                      <div className="flex items-center gap-1 shrink-0 text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(client.payment_due_date)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Tablet & Desktop Table (>= sm) */}
          <div className="hidden sm:block bg-white border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
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
                                <div className="text-xs text-gray-400 md:hidden">{client.name}</div>
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
          </div>
        </>
      )}

      <ClientFormModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </AppShell>
  );
}
