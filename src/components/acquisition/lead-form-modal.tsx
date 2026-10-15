'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { LeadPipelineStage } from '@/lib/types';

const leadSchema = z.object({
  name: z.string().min(2, 'Contact person name is required'),
  company: z.string().min(2, 'Company/Brand name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  industry: z.string().optional(),
  acquisition_source: z.enum([
    'Instagram',
    'Website',
    'Referral',
    'Meta Ads',
    'Google Search',
    'Networking',
    'Inbound PR',
    'Other',
  ]),
  referring_person: z.string().optional(),
  lead_owner_id: z.string().min(1, 'Lead owner is required'),
  estimated_deal_value: z.coerce.number().min(0),
  deal_type: z.enum(['retainer', 'project']),
  stage: z.enum(['new', 'contacted', 'qualified', 'meeting', 'proposal', 'negotiation', 'won', 'lost']),
  confidence_level: z.enum(['low', 'medium', 'high']),
  next_follow_up: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeadFormModal({ isOpen, onClose }: LeadFormModalProps) {
  const { addLead, users } = useAgencyStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      stage: 'new',
      acquisition_source: 'Website',
      deal_type: 'retainer',
      confidence_level: 'medium',
      estimated_deal_value: 300000,
    },
  });

  const onSubmit = (data: LeadFormData) => {
    const owner = users.find((u) => u.id === data.lead_owner_id);

    addLead({
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      industry: data.industry,
      acquisition_source: data.acquisition_source,
      referring_person: data.referring_person,
      lead_owner_id: data.lead_owner_id,
      lead_owner_name: owner ? owner.name : 'Unassigned',
      estimated_deal_value: data.estimated_deal_value,
      deal_type: data.deal_type,
      stage: data.stage as LeadPipelineStage,
      confidence_level: data.confidence_level,
      next_follow_up: data.next_follow_up,
      notes: data.notes,
    });

    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Pipeline Lead"
      description="Record a prospect, channel attribution, referring contact, and sales owner."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Company / Brand *</label>
            <input
              {...register('company')}
              placeholder="e.g. Solstice Solar Energy"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
            {errors.company && <p className="text-[10px] text-[#E5484D] mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Contact Person *</label>
            <input
              {...register('name')}
              placeholder="e.g. Kabir Thapar"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
            {errors.name && <p className="text-[10px] text-[#E5484D] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Email Address *</label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. kabir@solsticesolar.in"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
            {errors.email && <p className="text-[10px] text-[#E5484D] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Phone Number</label>
            <input
              {...register('phone')}
              placeholder="+91 98200 44122"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
          </div>
        </div>

        {/* Channels & Attribution */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Acquisition Channel *</label>
            <select
              {...register('acquisition_source')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="Instagram">Instagram</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Google Search">Google Search</option>
              <option value="Networking">Networking</option>
              <option value="Inbound PR">Inbound PR</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Referring Person (if any)</label>
            <input
              {...register('referring_person')}
              placeholder="Introduced by..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Sales Owner *</label>
            <select
              {...register('lead_owner_id')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="">Select sales owner...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Commercial Estimates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Deal Value (₹)</label>
            <input
              type="number"
              {...register('estimated_deal_value')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Deal Type</label>
            <select
              {...register('deal_type')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="retainer">Monthly Retainer</option>
              <option value="project">One-Time Project</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Initial Stage</label>
            <select
              {...register('stage')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="meeting">Meeting</option>
              <option value="proposal">Proposal</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              {...register('next_follow_up')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Confidence Level</label>
            <select
              {...register('confidence_level')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
            >
              <option value="high">High (&gt;75% likelihood)</option>
              <option value="medium">Medium</option>
              <option value="low">Low (early exploratory)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Lead Notes & Context</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Initial inquiry details, design brief, decision maker requirements..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit" disabled={isSubmitting}>
            Add Lead to Pipeline
          </Button>
        </div>
      </form>
    </Modal>
  );
}
