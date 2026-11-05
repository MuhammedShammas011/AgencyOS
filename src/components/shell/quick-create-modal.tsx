'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Building, X } from 'lucide-react';

interface QuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionSelect: (action: 'client' | 'lead' | 'proposal' | 'deliverable' | 'invoice' | 'expense') => void;
}

export function QuickCreateModal({ isOpen, onClose, onActionSelect }: QuickCreateModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleAddClient = () => {
    onClose();
    onActionSelect('client');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#171717]/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xl p-6 z-10 animate-fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DE] mb-4">
          <h3 className="text-base font-semibold text-[#171717]">Add New Client</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleAddClient}
          className="w-full flex items-center gap-3 p-4 rounded-lg border border-[#E6E4DE] hover:border-[#171717] hover:bg-[#FDFDFB] transition-all group text-left"
        >
          <div className="p-2 rounded-md bg-[#F2EFE9] group-hover:bg-[#1C1C1A] transition-colors">
            <Building className="w-4 h-4 text-[#171717] group-hover:text-[#D7FF64] transition-colors" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#171717]">Onboard New Client</div>
            <div className="text-xs text-[#777777] mt-0.5">Add client details, contact, assigned handler and payment info</div>
          </div>
        </button>
      </div>
    </div>
  );
}
