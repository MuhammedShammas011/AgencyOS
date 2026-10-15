'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ExpenseCategory } from '@/lib/types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseFormModal({ isOpen, onClose }: ExpenseFormModalProps) {
  const { addExpense, clients, projects } = useAgencyStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Software & AI Tools');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState<number>(15000);
  const [expenseDate, setExpenseDate] = useState('2026-10-15');

  React.useEffect(() => {
    setExpenseDate(new Date().toISOString().split('T')[0]);
  }, []);
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');

  const categories: ExpenseCategory[] = [
    'Freelancer & Contractor',
    'Software & AI Tools',
    'Production & Equipment',
    'Media Buying & Ad Spend',
    'Travel & Client Hospitality',
    'Office & Facilities',
    'Legal & Compliance',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !vendor || !amount) return;

    const client = clients.find((c) => c.id === clientId);

    addExpense({
      title,
      category,
      vendor,
      amount,
      expense_date: expenseDate,
      client_id: clientId || undefined,
      client_name: client ? client.name : undefined,
      notes: notes || undefined,
      payment_status: 'paid',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Agency Expense"
      description="Track equipment rentals, AI tools, contractor fees, or client hospitality."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Expense Description *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Cinema Camera Rig Rental (3 Days)"
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Vendor / Payee *</label>
            <input
              required
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Studio Nine Rentals"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Amount (₹) *</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Date</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Rebillable to Client (Optional)</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          >
            <option value="">None (Internal Studio Overhead)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Invoice / reference number or purpose..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit">
            Save Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
