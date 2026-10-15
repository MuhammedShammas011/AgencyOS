'use client';

import React, { useState } from 'react';
import { NavRail } from './nav-rail';
import { TopHeader } from './top-header';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { LeadFormModal } from '@/components/acquisition/lead-form-modal';
import { ProposalFormModal } from '@/components/proposals/proposal-form-modal';
import { DeliverableFormModal } from '@/components/delivery/deliverable-form-modal';
import { InvoiceFormModal } from '@/components/financials/invoice-form-modal';
import { ExpenseFormModal } from '@/components/financials/expense-form-modal';

interface AppShellProps {
  children: React.ReactNode;
  showEditorialBanner?: boolean;
}

export function AppShell({ children, showEditorialBanner = false }: AppShellProps) {
  const [activeQuickModal, setActiveQuickModal] = useState<
    'client' | 'lead' | 'proposal' | 'deliverable' | 'invoice' | 'expense' | null
  >(null);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F7F6F2]">
      {/* Slim Navigation Rail */}
      <NavRail />

      {/* Main Content Workspace Canvas */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-y-auto">
        <TopHeader
          showEditorialBanner={showEditorialBanner}
          onQuickAction={(action) => setActiveQuickModal(action)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <ClientFormModal
        isOpen={activeQuickModal === 'client'}
        onClose={() => setActiveQuickModal(null)}
      />
      <LeadFormModal
        isOpen={activeQuickModal === 'lead'}
        onClose={() => setActiveQuickModal(null)}
      />
      <ProposalFormModal
        isOpen={activeQuickModal === 'proposal'}
        onClose={() => setActiveQuickModal(null)}
      />
      <DeliverableFormModal
        isOpen={activeQuickModal === 'deliverable'}
        onClose={() => setActiveQuickModal(null)}
      />
      <InvoiceFormModal
        isOpen={activeQuickModal === 'invoice'}
        onClose={() => setActiveQuickModal(null)}
      />
      <ExpenseFormModal
        isOpen={activeQuickModal === 'expense'}
        onClose={() => setActiveQuickModal(null)}
      />
    </div>
  );
}
