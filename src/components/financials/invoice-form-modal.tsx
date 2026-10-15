'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { InvoiceLineItem } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, generateId } from '@/lib/utils';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceFormModal({ isOpen, onClose }: InvoiceFormModalProps) {
  const { createInvoice, clients, projects } = useAgencyStore();

  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [issueDate, setIssueDate] = useState('2026-10-15');
  const [dueDate, setDueDate] = useState('2026-10-30');

  React.useEffect(() => {
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]);
  }, []);
  const [paymentTerms, setPaymentTerms] = useState('Net 15');
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<InvoiceLineItem[]>([
    {
      id: 'init_inv_item_1',
      description: 'Monthly Creative & Digital Marketing Retainer',
      quantity: 1,
      unit_price: 250000,
      amount: 250000,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId('item'),
        description: 'Ad-hoc Production & 3D Render Passes',
        quantity: 1,
        unit_price: 50000,
        amount: 50000,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceLineItem, val: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === 'quantity' || field === 'unit_price') {
            updated.amount = Number(updated.quantity) * Number(updated.unit_price);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((acc, i) => acc + (i.amount || 0), 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const client = clients.find((c) => c.id === clientId);
    const project = projects.find((p) => p.id === projectId);

    createInvoice({
      client_id: clientId,
      client_name: client ? client.name : 'Client',
      project_id: projectId || undefined,
      project_name: project ? project.name : undefined,
      issue_date: issueDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      tax_rate: taxRate,
      items,
      notes: notes || undefined,
      status: 'sent',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Tax Invoice"
      description="Create a formal agency invoice with GST calculations and payment schedule."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Target Client *</label>
            <select
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Linked Project (Optional)</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">None / General Retainer</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Issue Date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2 border-t border-[#E6E4DE]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#171717]">Invoice Items</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-medium text-[#171717] hover:text-black flex items-center gap-1 bg-[#F2EFE9] px-2 py-1 rounded"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 p-2 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] items-center text-xs"
              >
                <div className="col-span-6">
                  <input
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Description..."
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] text-center font-mono outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(item.id, 'unit_price', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-[#777777] hover:text-[#E5484D] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-[#1C1C1A] text-white p-3.5 rounded-xl border border-[#2F2F2C] flex items-center justify-between font-mono text-xs">
          <div className="space-y-1 text-[#A3A29E]">
            <div>Subtotal: {formatCurrency(subtotal)}</div>
            <div>Tax (18% GST): {formatCurrency(taxAmount)}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-[#A3A29E]">Total Due</div>
            <div className="text-lg font-bold text-[#D7FF64]">{formatCurrency(totalAmount)}</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit">
            Issue Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
