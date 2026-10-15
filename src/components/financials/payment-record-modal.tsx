'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, CheckCircle2 } from 'lucide-react';

interface PaymentRecordModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function PaymentRecordModal({ invoice, onClose }: PaymentRecordModalProps) {
  const { recordPayment, currentUser } = useAgencyStore();

  const [amount, setAmount] = useState<number>(invoice?.outstanding_amount || 100000);
  const [paymentDate, setPaymentDate] = useState('2026-10-15');
  const [paymentMethod, setPaymentMethod] = useState<
    'Bank Transfer / NEFT' | 'UPI' | 'Wire / Swift' | 'Credit Card / Stripe' | 'Cheque'
  >('Bank Transfer / NEFT');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.outstanding_amount);
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !transactionReference) return;

    recordPayment(invoice.id, {
      invoice_id: invoice.id,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      transaction_reference: transactionReference,
      recorded_by_name: currentUser.name,
      notes: notes || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoice_number}`}
      description={`Client: ${invoice.client_name} • Outstanding Balance: ${formatCurrency(invoice.outstanding_amount)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice Summary */}
        <div className="p-3 bg-[#FAFAF8] rounded-xl border border-[#E6E4DE] text-xs font-mono flex items-center justify-between">
          <div>
            <span className="text-[10px] text-[#777777] uppercase block">Total Invoiced</span>
            <span className="font-semibold text-[#171717]">{formatCurrency(invoice.total_amount)}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#777777] uppercase block">Previously Paid</span>
            <span className="font-semibold text-[#30A46C]">{formatCurrency(invoice.amount_paid)}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#777777] uppercase block">Balance Due</span>
            <span className="font-bold text-[#E5484D]">{formatCurrency(invoice.outstanding_amount)}</span>
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#171717]">Payment Amount Received (₹) *</label>
            <button
              type="button"
              onClick={() => setAmount(invoice.outstanding_amount)}
              className="text-[10px] font-mono text-[#171717] underline hover:text-black"
            >
              Set Full Balance
            </button>
          </div>
          <input
            type="number"
            required
            max={invoice.outstanding_amount}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full text-sm font-mono font-bold px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
          {amount < invoice.outstanding_amount && amount > 0 && (
            <p className="text-[10px] text-[#B7791F] mt-1 font-mono">
              Note: This is a partial payment. Remaining balance will be {formatCurrency(invoice.outstanding_amount - amount)}.
            </p>
          )}
        </div>

        {/* Method & Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="Bank Transfer / NEFT">Bank Transfer / NEFT</option>
              <option value="UPI">UPI</option>
              <option value="Wire / Swift">Wire / Swift</option>
              <option value="Credit Card / Stripe">Credit Card / Stripe</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Payment Date *</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        {/* Reference */}
        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">
            Bank Transaction / UTR / Reference ID *
          </label>
          <input
            required
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="e.g. HDFC26101509923 or UPI/261015/ICICI"
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional receipt notes, bank account deposited to..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit">
            Confirm & Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
