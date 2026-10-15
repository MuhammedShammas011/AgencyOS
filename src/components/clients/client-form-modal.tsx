'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ServiceType, ClientStatus } from '@/lib/types';
import { getTodayDateString } from '@/lib/utils';

const clientSchema = z.object({
  name: z.string().min(2, 'Client name is required'),
  company: z.string().min(2, 'Company legal name is required'),
  contactPerson: z.string().min(2, 'Contact person name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  industry: z.string().min(2, 'Industry is required'),
  services: z.array(z.string()).min(1, 'Select at least one service'),
  acquisition_source_name: z.string().min(1, 'Acquisition channel is required'),
  referring_person: z.string().optional(),
  account_manager_id: z.string().min(1, 'Account manager must be assigned'),
  monthly_retainer: z.coerce.number().min(0),
  project_value: z.coerce.number().min(0),
  contract_start_date: z.string().min(1, 'Contract start date is required'),
  contract_end_date: z.string().optional(),
  status: z.enum(['active', 'onboarding', 'at_risk', 'paused', 'lost', 'completed']),
  internal_notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientFormModal({ isOpen, onClose }: ClientFormModalProps) {
  const { addClient, users } = useAgencyStore();

  const serviceOptions: ServiceType[] = [
    'Brand Identity & Strategy',
    'Social Media Management',
    'Video Production',
    'Graphic & Motion Design',
    'Website & App Development',
    'Performance Marketing & SEO',
    'Commercial Photography',
    'Influencer & PR Campaigns',
  ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'onboarding',
      services: ['Brand Identity & Strategy'],
      monthly_retainer: 250000,
      project_value: 0,
      contract_start_date: getTodayDateString(),
      acquisition_source_name: 'Direct Outreach',
    },
  });

  const selectedServices = watch('services') || [];

  const handleServiceToggle = (svc: ServiceType) => {
    if (selectedServices.includes(svc)) {
      setValue('services', selectedServices.filter((s) => s !== svc));
    } else {
      setValue('services', [...selectedServices, svc]);
    }
  };

  const onSubmit = (data: ClientFormData) => {
    const assignedUser = users.find((u) => u.id === data.account_manager_id);

    addClient({
      name: data.name,
      company: data.company,
      industry: data.industry,
      status: data.status,
      services: data.services as ServiceType[],
      acquisition_source_name: data.acquisition_source_name,
      referring_person: data.referring_person,
      account_manager_id: data.account_manager_id,
      account_manager_name: assignedUser ? assignedUser.name : 'Unassigned',
      monthly_retainer: data.monthly_retainer,
      project_value: data.project_value,
      contract_start_date: data.contract_start_date,
      contract_end_date: data.contract_end_date,
      internal_notes: data.internal_notes,
    });

    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Onboard New Agency Client"
      description="Initialize client commercial parameters, services, and operational ownership."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Core Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Client Brand Name *</label>
            <input
              {...register('name')}
              placeholder="e.g. Elysian Organics"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
            {errors.name && <p className="text-[10px] text-[#E5484D] mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Company Legal Entity *</label>
            <input
              {...register('company')}
              placeholder="e.g. Elysian Botanicals Pvt Ltd"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
            {errors.company && <p className="text-[10px] text-[#E5484D] mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Primary Contact Person *</label>
            <input
              {...register('contactPerson')}
              placeholder="e.g. Maya Sethi (Founder & CMO)"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
            {errors.contactPerson && <p className="text-[10px] text-[#E5484D] mt-1">{errors.contactPerson.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Official Email Address *</label>
            <input
              type="email"
              {...register('email')}
              placeholder="e.g. maya@elysian.com"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
            {errors.email && <p className="text-[10px] text-[#E5484D] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Industry Vertical *</label>
            <input
              {...register('industry')}
              placeholder="e.g. Luxury Clean Skincare / Fintech"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
            {errors.industry && <p className="text-[10px] text-[#E5484D] mt-1">{errors.industry.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Dedicated Account Director *</label>
            <select
              {...register('account_manager_id')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            >
              <option value="">Select account manager...</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.title})
                </option>
              ))}
            </select>
            {errors.account_manager_id && (
              <p className="text-[10px] text-[#E5484D] mt-1">{errors.account_manager_id.message}</p>
            )}
          </div>
        </div>

        {/* Commercials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Monthly Retainer (₹)</label>
            <input
              type="number"
              {...register('monthly_retainer')}
              placeholder="0"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none focus:border-[#171717]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">One-time Project Value (₹)</label>
            <input
              type="number"
              {...register('project_value')}
              placeholder="0"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none focus:border-[#171717]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Initial Status</label>
            <select
              {...register('status')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            >
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="at_risk">At Risk</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        {/* Acquisition Source & Referrer separation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Acquisition Channel *</label>
            <select
              {...register('acquisition_source_name')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            >
              <option value="Instagram Inbound">Instagram Inbound</option>
              <option value="Website Inquiry">Website Inquiry</option>
              <option value="Referral">Client / Peer Referral</option>
              <option value="Meta Ads">Meta Performance Ads</option>
              <option value="Direct Outreach">Direct Outreach</option>
              <option value="Networking">Networking / Event</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Referring Person (if any)</label>
            <input
              {...register('referring_person')}
              placeholder="e.g. Siddharth Mittal"
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none focus:border-[#171717]"
            />
          </div>
        </div>

        {/* Services Selection */}
        <div className="pt-2 border-t border-[#E6E4DE]">
          <label className="block text-xs font-semibold text-[#171717] mb-2">Contracted Services *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {serviceOptions.map((svc) => {
              const isSelected = selectedServices.includes(svc);
              return (
                <button
                  type="button"
                  key={svc}
                  onClick={() => handleServiceToggle(svc)}
                  className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#171717] bg-[#1C1C1A] text-[#D7FF64] font-medium'
                      : 'border-[#E6E4DE] bg-[#FAFAF8] text-[#555555] hover:border-[#BBBBBB]'
                  }`}
                >
                  {svc}
                </button>
              );
            })}
          </div>
          {errors.services && <p className="text-[10px] text-[#E5484D] mt-1">{errors.services.message}</p>}
        </div>

        {/* Contract Dates & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E6E4DE]">
          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Contract Start Date *</label>
            <input
              type="date"
              {...register('contract_start_date')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#171717] mb-1">Contract End Date</label>
            <input
              type="date"
              {...register('contract_end_date')}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] font-mono outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#171717] mb-1">Internal Strategic Notes</label>
          <textarea
            {...register('internal_notes')}
            rows={2}
            placeholder="Special aesthetic requirements, brand guidelines, key executive quirks..."
            className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E4DE]">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="chartreuse" size="sm" type="submit" disabled={isSubmitting}>
            Complete Client Onboarding
          </Button>
        </div>
      </form>
    </Modal>
  );
}
