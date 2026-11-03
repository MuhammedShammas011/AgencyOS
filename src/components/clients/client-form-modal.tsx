'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { Client, ServiceType } from '@/lib/types';
import { getTodayDateString } from '@/lib/utils';

const SERVICE_OPTIONS: ServiceType[] = [
  'Brand Identity & Strategy',
  'Rebranding',
  'UI/UX Design',
  'Logo Design',
  'Graphic & Motion Design',
  'Social Media Management',
  'Content Creation',
  'Video Production',
  'Website & App Development',
  'Performance Marketing & SEO',
  'Commercial Photography',
  'Influencer & PR Campaigns',
];

const clientSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  name: z.string().min(1, 'Contact person is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  account_manager_id: z.string().min(1, 'Please assign a team member'),
  agreed_amount: z.coerce.number().min(0),
  payment_due_date: z.string().optional(),
  services: z.array(z.string()).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: Client | null;
}

export function ClientFormModal({ isOpen, onClose, client }: ClientFormModalProps) {
  const { addClient, updateClient, users } = useAgencyStore();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      company: '',
      name: '',
      phone: '',
      email: '',
      account_manager_id: '',
      agreed_amount: 0,
      payment_due_date: '',
      services: [],
    },
  });

  const selectedServices = watch('services') ?? [];

  const toggleService = (svc: string) => {
    if (selectedServices.includes(svc)) {
      setValue('services', selectedServices.filter((s) => s !== svc));
    } else {
      setValue('services', [...selectedServices, svc]);
    }
  };

  useEffect(() => {
    if (client) {
      reset({
        company: client.company || '',
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        account_manager_id: client.account_manager_id || '',
        agreed_amount: client.agreed_amount ?? client.project_value ?? 0,
        payment_due_date: client.payment_due_date || '',
        services: client.services || [],
      });
    } else {
      reset({
        company: '',
        name: '',
        phone: '',
        email: '',
        account_manager_id: users[0]?.id || '',
        agreed_amount: 0,
        payment_due_date: '',
        services: [],
      });
    }
  }, [client, isOpen, reset, users]);

  const onSubmit = (data: ClientFormData) => {
    const assignedUser = users.find((u) => u.id === data.account_manager_id);

    const payload = {
      company: data.company,
      name: data.name,
      phone: data.phone,
      email: data.email,
      account_manager_id: data.account_manager_id,
      account_manager_name: assignedUser?.name || '',
      agreed_amount: data.agreed_amount,
      project_value: data.agreed_amount,
      payment_due_date: data.payment_due_date || undefined,
      services: (data.services || []) as ServiceType[],
      contract_start_date: getTodayDateString(),
      industry: 'General',
      status: 'active' as const,
      acquisition_source_name: 'Direct',
    };

    if (client) {
      updateClient(client.id, payload);
    } else {
      addClient(payload);
    }

    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? 'Edit Client' : 'Add Client'}
      description={client ? 'Update client information.' : 'Add a new client to your list.'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Core Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Name *</label>
            <input
              {...register('company')}
              placeholder="e.g. Acme Corp"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
            {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person *</label>
            <input
              {...register('name')}
              placeholder="e.g. John Smith"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              {...register('phone')}
              placeholder="+91 98765 43210"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              placeholder="contact@company.com"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Team Member *</label>
            <select
              {...register('account_manager_id')}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            >
              <option value="">Select team member</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            {errors.account_manager_id && <p className="text-xs text-red-500 mt-1">{errors.account_manager_id.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agreed Amount (₹)</label>
            <input
              type="number"
              {...register('agreed_amount')}
              placeholder="0"
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Due Date</label>
            <input
              type="date"
              {...register('payment_due_date')}
              className="w-full sm:w-auto text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Services */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Work / Services</label>
          <div className="flex flex-wrap gap-2">
            {SERVICE_OPTIONS.map((svc) => {
              const selected = selectedServices.includes(svc);
              return (
                <button
                  type="button"
                  key={svc}
                  onClick={() => toggleService(svc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    selected
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {svc}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {client ? 'Save Changes' : 'Add Client'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
