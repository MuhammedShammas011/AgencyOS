'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Building } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { clients } = useAgencyStore();

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
  const matchingClients = q
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
    : [];

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
            placeholder="Search clients by name, company or email..."
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
              <p className="text-xs text-[#777777]">Type a client name or company to search…</p>
            </div>
          ) : matchingClients.length > 0 ? (
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
                      <div className="text-[11px] text-[#777777]">{c.company}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#777777] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#777777]">
              No clients found for &quot;{query}&quot;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
