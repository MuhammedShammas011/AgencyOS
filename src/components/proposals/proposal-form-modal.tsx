'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ServiceType, ProposalLineItem } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency, generateId } from '@/lib/utils';

interface ProposalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProposalFormModal({ isOpen, onClose }: ProposalFormModalProps) {
  const { createProposal, clients, leads, users, currentUser } = useAgencyStore();

  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [salesOwnerId, setSalesOwnerId] = useState(currentUser.id);
  const [validUntil, setValidUntil] = useState('2026-11-15');

  React.useEffect(() => {
    setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  }, []);
  const [expectedDecisionDate, setExpectedDecisionDate] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<ProposalLineItem[]>([
    {
      id: 'init_prop_item_1',
      description: 'Brand Identity System & Design Guidelines',
      service_category: 'Brand Identity & Strategy',
      quantity: 1,
      unit_price: 350000,
      total: 350000,
    },
  ]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateId('item'),
        description: 'Monthly Social Media Content & Reels (Batch of 12)',
        service_category: 'Social Media Management',
        quantity: 1,
        unit_price: 250000,
        total: 250000,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: keyof ProposalLineItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unit_price') {
            updated.total = Number(updated.quantity) * Number(updated.unit_price);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((acc, i) => acc + (i.total || 0), 0);
  const discountAmount = Math.round((subtotal * discountRate) / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = Math.round((taxable * taxRate) / 100);
  const totalQuotedValue = taxable + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    const salesOwner = users.find((u) => u.id === salesOwnerId);

    createProposal({
      client_name: clientName || company,
      company,
      sales_owner_id: salesOwnerId,
      sales_owner_name: salesOwner ? salesOwner.name : currentUser.name,
      items,
      subtotal,
      discount_rate: discountRate,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_quoted_value: totalQuotedValue,
      valid_until: validUntil,
      expected_decision_date: expectedDecisionDate || undefined,
      notes,
      status: 'sent',
    });

    onClose();
  };

  const handleSelectClient = (clientId: string) => {
    const c = clients.find((x) => x.id === clientId);
    if (c) {
      setClientName(c.name);
      setCompany(c.company);
    }
  };

  const handleSelectLead = (leadId: string) => {
    const l = leads.find((x) => x.id === leadId);
    if (l) {
      setClientName(l.name);
      setCompany(l.company);
      if (l.lead_owner_id) setSalesOwnerId(l.lead_owner_id);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Commercial Proposal"
      description="Create an itemized quote with custom scope, tax rates, and discount structure."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Autofill from existing Client or Lead */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAFAF8] rounded-lg border border-[#E6E4DE]">
          <div>
            <label className="block text-[11px] font-mono text-[#777777] mb-1">Autofill from Client</label>
            <select
              onChange={(e) => handleSelectClient(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">Choose existing client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#777777] mb-1">Autofill from Pipeline Lead</label>
            <select
              onChange={(e) => handleSelectLead(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">Choose active lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company} — {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Company & Client Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#171717] mb-1">Target Client / Company *</label>
            <input
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Elysian Organics"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Sales Owner *</label>
            <select
              value={salesOwnerId}
              onChange={(e) => setSalesOwnerId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-2 pt-2 border-t border-[#E6E4DE]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#171717]">Itemized Deliverable Scope</label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-[11px] font-medium text-[#171717] hover:text-black flex items-center gap-1 bg-[#F2EFE9] px-2 py-1 rounded"
            >
              <Plus className="w-3 h-3" /> Add Scope Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 p-2.5 rounded-lg border border-[#E6E4DE] bg-[#FAFAF8] items-center text-xs"
              >
                <div className="col-span-5">
                  <input
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Deliverable description..."
                    className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  />
                </div>

                <div className="col-span-3">
                  <select
                    value={item.service_category}
                    onChange={(e) =>
                      handleItemChange(item.id, 'service_category', e.target.value as ServiceType)
                    }
                    className="w-full text-[11px] px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
                  >
                    <option value="Brand Identity & Strategy">Brand Identity</option>
                    <option value="Social Media Management">Social Media</option>
                    <option value="Video Production">Video Production</option>
                    <option value="Graphic & Motion Design">Graphic/Motion</option>
                    <option value="Website & App Development">Web/App Dev</option>
                    <option value="Performance Marketing & SEO">Performance</option>
                    <option value="Commercial Photography">Photography</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    className="w-full text-xs px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] text-center font-mono outline-none"
                  />
                </div>

                <div className="col-span-2">
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
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commercial Totals and Calculations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#171717] mb-1">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#171717] mb-1">GST / Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="28"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#171717] mb-1">Valid Until</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#171717] mb-1">Decision Target</label>
                <input
                  type="date"
                  value={expectedDecisionDate}
                  onChange={(e) => setExpectedDecisionDate(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing Breakdown Summary Card */}
          <div className="bg-[#1C1C1A] text-white p-4 rounded-xl border border-[#2F2F2C] flex flex-col justify-between">
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-[#A3A29E]">
                <span>Scope Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountRate > 0 && (
                <div className="flex justify-between text-[#D7FF64]">
                  <span>Discount ({discountRate}%):</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[#A3A29E]">
                <span>Tax ({taxRate}% GST):</span>
                <span>+ {formatCurrency(taxAmount)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2F2F2C] mt-2 flex items-baseline justify-between">
              <span className="text-xs uppercase font-mono tracking-wider text-[#A3A29E]">Total Quote</span>
              <span className="text-xl font-bold font-mono text-[#D7FF64]">
                {formatCurrency(totalQuotedValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit">
            Create & Issue Proposal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
