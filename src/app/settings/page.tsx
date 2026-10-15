'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Database,
  ShieldCheck,
  Key,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Server,
  Lock,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { currentRole, setCurrentRole, activityLogs, resetToDefaultData } = useAgencyStore();
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'database' | 'roles' | 'audit'>('database');

  const handleCopySql = () => {
    navigator.clipboard.writeText(`-- Agency OS Database Schema
-- Check supabase/migrations/20261015000000_agency_os_schema.sql for the full migration
-- Tables: profiles, clients, leads, proposals, deliverables, invoices, payments, client_closures, activity_logs
`);
    setCopiedSql(true);
    toast.success('SQL schema migration copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const rolePermissions = [
    {
      role: 'admin' as UserRole,
      title: 'Administrator',
      clients: 'Full CRUD',
      financials: 'Full Ledger, Invoices & Banking',
      deliverables: 'Manage All',
      retention: 'Full Access & Closure',
    },
    {
      role: 'management' as UserRole,
      title: 'Executive Management',
      clients: 'Full Access',
      financials: 'Read & Analytics',
      deliverables: 'Review Gates',
      retention: 'Full Access & Closure',
    },
    {
      role: 'sales' as UserRole,
      title: 'Sales & Growth',
      clients: 'Create & View',
      financials: 'Proposals Quoting Only',
      deliverables: 'View Scopes',
      retention: 'View Analytics',
    },
    {
      role: 'account_manager' as UserRole,
      title: 'Account Director',
      clients: 'Manage Assigned',
      financials: 'Invoices & Balances',
      deliverables: 'Client Review Submissions',
      retention: 'Record Client Closures',
    },
    {
      role: 'project_manager' as UserRole,
      title: 'Project Producer',
      clients: 'View Scope',
      financials: 'Project Budgets Only',
      deliverables: 'Manage Sprints & Gates',
      retention: 'Restricted',
    },
    {
      role: 'creative' as UserRole,
      title: 'Creative / Execution Team',
      clients: 'View Brand Briefs',
      financials: 'Restricted (Hidden)',
      deliverables: 'Submit Version Uploads',
      retention: 'Restricted',
    },
    {
      role: 'finance' as UserRole,
      title: 'Finance Controller',
      clients: 'Commercial Terms',
      financials: 'Full Invoices, Aging & Payments',
      deliverables: 'View Milestone Dates',
      retention: 'Unsettled Balances Audit',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Governance & Infrastructure
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">PostgreSQL & RBAC</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Settings & Access Control
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Configure Supabase PostgreSQL persistence, manage role permissions, and inspect immutable audit event logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="danger" size="sm" onClick={resetToDefaultData} className="gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs">
          {[
            { id: 'database', label: 'Database & Supabase Integration', icon: Database },
            { id: 'roles', label: 'Role-Based Access Control (RBAC)', icon: ShieldCheck },
            { id: 'audit', label: `System Audit Log (${activityLogs.length} Events)`, icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1A] text-[#D7FF64] shadow-xs'
                    : 'text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: SUPABASE & DATABASE CONFIGURATION */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-[#1C1C1A] text-[#D7FF64]">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#171717]">
                      Supabase PostgreSQL Connection Status
                    </h3>
                    <p className="text-xs text-[#777777]">
                      {isSupabaseConfigured
                        ? 'Connected to remote Supabase database instance'
                        : 'Running with high-fidelity local state persistence (Zero credentials required to test)'}
                    </p>
                  </div>
                </div>

                <Badge variant={isSupabaseConfigured ? 'success' : 'chartreuse'}>
                  {isSupabaseConfigured ? 'SUPABASE ONLINE' : 'LOCAL HYBRID STORE ACTIVE'}
                </Badge>
              </div>

              {/* Environment Variables Guide */}
              <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#E6E4DE] space-y-2 font-mono text-xs">
                <div className="text-[11px] font-semibold text-[#171717] font-sans">
                  Environment Configuration (.env.local)
                </div>
                <div className="p-2.5 bg-[#FFFFFF] rounded border border-[#E6E4DE] text-[#444444]">
                  <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here</div>
                </div>
                <p className="text-[10px] text-[#777777] font-sans">
                  When credentials are provided in <code>.env.local</code>, Agency OS connects automatically to Supabase. All forms, tables, and analytics function immediately with real local persistence.
                </p>
              </div>
            </div>

            {/* SQL Migration Script Inspector */}
            <div className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#171717]">
                    PostgreSQL Production Schema Migration
                  </h3>
                  <p className="text-xs text-[#777777]">
                    Complete relational SQL schema located at{' '}
                    <code className="text-[#171717] font-mono">
                      supabase/migrations/20261015000000_agency_os_schema.sql
                    </code>
                  </p>
                </div>

                <Button variant="outline" size="sm" onClick={handleCopySql} className="gap-1.5 text-xs">
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-[#30A46C]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL Schema'}</span>
                </Button>
              </div>

              <div className="p-4 bg-[#1C1C1A] text-[#D7FF64] rounded-xl font-mono text-xs max-h-64 overflow-y-auto leading-relaxed border border-[#2F2F2C]">
                <pre>{`-- Agency OS — Comprehensive PostgreSQL Schema for Supabase
-- Tables included:
-- 1. profiles & roles (admin, management, sales, account_manager, project_manager, creative, finance)
-- 2. clients & client_contacts & client_assignments
-- 3. leads & lead_stage_history & acquisition_sources
-- 4. proposals & proposal_items & proposal_versions
-- 5. projects & project_members & tasks
-- 6. deliverables & deliverable_versions
-- 7. invoices & invoice_items & payments
-- 8. expenses
-- 9. client_closures (empirical retention root-cause analysis)
-- 10. client_interactions & activity_logs & notifications
-- Row Level Security (RLS) policies enabled with role-based restriction`}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLES & RBAC MATRIX */}
        {activeTab === 'roles' && (
          <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs space-y-4 p-5">
            <div>
              <h3 className="text-sm font-semibold text-[#171717]">
                Role-Based Access Control (RBAC) Permissions Matrix
              </h3>
              <p className="text-xs text-[#777777]">
                Granular segregation of duties. You can switch your active simulated role at any time from the top header.
              </p>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
                <tr>
                  <th className="px-4 py-3">Role Identity</th>
                  <th className="px-4 py-3">Client Universe</th>
                  <th className="px-4 py-3">Financial Intelligence</th>
                  <th className="px-4 py-3">Delivery Studio</th>
                  <th className="px-4 py-3">Retention Protocol</th>
                  <th className="px-4 py-3 text-right">Switch Active Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DE]">
                {rolePermissions.map((rp) => {
                  const isActive = currentRole === rp.role;
                  return (
                    <tr key={rp.role} className={`hover:bg-[#F7F6F2] ${isActive ? 'bg-[#FCFCFA]' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-[#171717]">
                        <div className="flex items-center gap-2">
                          <span>{rp.title}</span>
                          {isActive && <Badge variant="chartreuse">ACTIVE</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">{rp.clients}</td>
                      <td className="px-4 py-3 text-[#555555]">
                        <span className={rp.financials.includes('Restricted') ? 'text-[#E5484D] font-mono' : ''}>
                          {rp.financials}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#555555]">{rp.deliverables}</td>
                      <td className="px-4 py-3 text-[#555555]">{rp.retention}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={isActive ? 'outline' : 'secondary'}
                          size="sm"
                          onClick={() => {
                            setCurrentRole(rp.role);
                            toast.success(`Role switched to ${rp.title}`);
                          }}
                          className="text-xs h-7"
                        >
                          {isActive ? 'Current' : 'Simulate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[#E6E4DE] bg-[#FAFAF8] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase text-[#777777] font-semibold">
                  Immutable Event Bus & Audit Log
                </h3>
                <p className="text-xs text-[#555555]">
                  Records all proposal value changes, client status shifts, payment receipts, and team assignments
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#E6E4DE]">
              {activityLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="font-semibold text-[#171717]">{log.description}</div>
                    <div className="text-[11px] text-[#777777] font-mono mt-0.5">
                      Actor: {log.actor_name} ({log.actor_role}) • Entity: {log.entity_type.toUpperCase()} / {log.entity_name}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#999999] shrink-0">
                    {formatDate(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
