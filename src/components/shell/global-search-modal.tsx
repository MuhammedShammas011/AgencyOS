'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Building, FileText, Layers, DollarSign, User } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { formatCurrency } from '@/lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { clients, leads, proposals, projects, deliverables, invoices, users } = useAgencyStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingClients = q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)) : [];
  const matchingLeads = q ? leads.filter((l) => l.company.toLowerCase().includes(q) || l.name.toLowerCase().includes(q)) : [];
  const matchingProposals = q ? proposals.filter((p) => p.proposal_number.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q)) : [];
  const matchingProjects = q ? projects.filter((pr) => pr.name.toLowerCase().includes(q) || pr.client_name.toLowerCase().includes(q)) : [];
  const matchingDeliverables = q ? deliverables.filter((d) => d.title.toLowerCase().includes(q) || d.client_name.toLowerCase().includes(q)) : [];
  const matchingInvoices = q ? invoices.filter((i) => i.invoice_number.toLowerCase().includes(q) || i.client_name.toLowerCase().includes(q)) : [];

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xl overflow-hidden z-10 animate-fade-in flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E6E4DE] gap-3 bg-[#FAFAF8]">
          <Search className="w-5 h-5 text-[#777777] shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search clients, leads, proposals, deliverables, invoices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#171717] placeholder:text-[#999999] outline-none"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono bg-[#E6E4DE] text-[#555555] rounded">ESC</kbd>
        </div>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!q ? (
            <div className="py-8 px-4 text-center">
              <p className="text-xs text-[#777777]">Type a client name, deliverable title, invoice #, or lead to inspect...</p>
              <div className="flex justify-center gap-2 mt-3 text-[11px] text-[#999999]">
                <span className="px-2 py-1 bg-[#F2EFE9] rounded">Try "Elysian"</span>
                <span className="px-2 py-1 bg-[#F2EFE9] rounded">Try "Kavach"</span>
                <span className="px-2 py-1 bg-[#F2EFE9] rounded">Try "INV-2026"</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {matchingClients.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#777777] px-3 py-1">Clients</div>
                  {matchingClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(`/clients/${c.id}`)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F6F2] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building className="w-4 h-4 text-[#777777]" />
                        <div>
                          <div className="text-xs font-semibold text-[#171717]">{c.name}</div>
                          <div className="text-[11px] text-[#777777]">{c.industry} • Status: {c.status}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {matchingLeads.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#777777] px-3 py-1">Leads & Prospects</div>
                  {matchingLeads.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleSelect('/acquisition')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F6F2] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-[#777777]" />
                        <div>
                          <div className="text-xs font-semibold text-[#171717]">{l.company} ({l.name})</div>
                          <div className="text-[11px] text-[#777777]">Stage: {l.stage.toUpperCase()} • Value: {formatCurrency(l.estimated_deal_value)}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {matchingDeliverables.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#777777] px-3 py-1">Deliverables</div>
                  {matchingDeliverables.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => handleSelect('/delivery')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F6F2] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-[#777777]" />
                        <div>
                          <div className="text-xs font-semibold text-[#171717]">{d.title}</div>
                          <div className="text-[11px] text-[#777777]">{d.client_name} • Due: {d.due_date} • {d.status}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {matchingInvoices.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#777777] px-3 py-1">Invoices</div>
                  {matchingInvoices.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => handleSelect('/financials')}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[#F7F6F2] transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <DollarSign className="w-4 h-4 text-[#777777]" />
                        <div>
                          <div className="text-xs font-semibold text-[#171717]">{i.invoice_number} — {i.client_name}</div>
                          <div className="text-[11px] text-[#777777]">Total: {formatCurrency(i.total_amount)} • Status: {i.status}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              )}

              {matchingClients.length === 0 &&
                matchingLeads.length === 0 &&
                matchingDeliverables.length === 0 &&
                matchingInvoices.length === 0 && (
                  <div className="py-8 text-center text-xs text-[#777777]">
                    No matching records found for "{query}".
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
