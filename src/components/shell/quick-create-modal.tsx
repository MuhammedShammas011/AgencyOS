'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building, UserPlus, FileSpreadsheet, Layers, DollarSign, Receipt, ArrowRight } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: 'client' | 'lead' | 'proposal' | 'deliverable' | 'invoice' | 'expense') => void;
}

export function QuickCreateModal({ isOpen, onClose, onActionSelect }: QuickCreateModalProps) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'client' as const,
      label: 'Onboard New Client',
      description: 'Add a new client with retainer, industry, services, and account owner',
      icon: Building,
      badge: 'Client Universe',
    },
    {
      id: 'lead' as const,
      label: 'Add Pipeline Lead',
      description: 'Record an inbound inquiry, channel source, referring person, and deal value',
      icon: UserPlus,
      badge: 'Acquisition',
    },
    {
      id: 'proposal' as const,
      label: 'Generate Proposal',
      description: 'Create an itemized quote with custom scope, tax rates, and discount lines',
      icon: FileSpreadsheet,
      badge: 'Proposals',
    },
    {
      id: 'deliverable' as const,
      label: 'Create Deliverable',
      description: 'Log creative deliverable with deadline, versioning, and client review track',
      icon: Layers,
      badge: 'Delivery Studio',
    },
    {
      id: 'invoice' as const,
      label: 'Issue Tax Invoice',
      description: 'Create billing invoice with payment terms and line item schedule',
      icon: DollarSign,
      badge: 'Financials',
    },
    {
      id: 'expense' as const,
      label: 'Record Agency Expense',
      description: 'Track equipment rentals, AI tools, contractor fees, or client hospitality',
      icon: Receipt,
      badge: 'Financials',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xl p-6 z-10 animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DE]">
          <div>
            <h3 className="text-base font-semibold text-[#171717]">Quick Create</h3>
            <p className="text-xs text-[#777777]">Select an action to launch the validated creation workflow</p>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#777777] hover:text-[#171717] px-2 py-1 rounded bg-[#F2EFE9]"
          >
            ESC
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  onClose();
                  onActionSelect(act.id);
                }}
                className="flex flex-col text-left p-3.5 rounded-lg border border-[#E6E4DE] hover:border-[#171717] hover:bg-[#FDFDFB] transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-2 rounded-md bg-[#F2EFE9] group-hover:bg-[#1C1C1A] group-hover:text-[#D7FF64] transition-colors text-[#171717]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono text-[#777777] uppercase tracking-wider">{act.badge}</span>
                </div>
                <span className="text-xs font-semibold text-[#171717] group-hover:text-black mb-1">{act.label}</span>
                <span className="text-[11px] text-[#777777] leading-relaxed line-clamp-2">{act.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
