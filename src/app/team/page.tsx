'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { UserProfile, UserRole } from '@/lib/types';
import { isPastDate, formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  ShieldCheck,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Mail,
  UserPlus
} from 'lucide-react';

export default function TeamPage() {
  const { users, clients, projects, tasks, deliverables } = useAgencyStore();
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredUsers = users.filter((u) => {
    return departmentFilter === 'all' || u.department === departmentFilter;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E4DE]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#777777] font-semibold">
                Studio Capacity & Talent
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#171717]" />
              <span className="text-xs font-mono text-[#777777]">{users.length} Team Members</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-editorial-heading text-[#171717] tracking-tight mt-1">
              Team & Workload Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Balanced workload distribution across Account Directors, Creative Leads, Delivery Producers, and Sales owners.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] text-[#171717] outline-none"
            >
              <option value="all">All Studio Departments</option>
              <option value="Leadership">Leadership</option>
              <option value="Client Success">Client Success</option>
              <option value="Design & Creative">Design & Creative</option>
              <option value="Engineering">Engineering</option>
              <option value="Performance & Growth">Performance & Growth</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((member) => {
            // Associated clients (as account manager)
            const managedClients = clients.filter((c) => c.account_manager_id === member.id);

            // Assigned deliverables
            const memberDeliverables = deliverables.filter((d) => d.assigned_owner_id === member.id);
            const overdueDeliverables = memberDeliverables.filter(
              (d) => d.status !== 'approved' && isPastDate(d.due_date)
            );
            const approvedDeliverables = memberDeliverables.filter((d) => d.status === 'approved');

            // Assigned tasks
            const memberTasks = tasks.filter((t) => t.assigned_to_id === member.id);
            const openTasks = memberTasks.filter((t) => t.status !== 'done');

            // Workload index calculation (considers active clients, open deliverables, overdue tasks)
            const workloadIndex = managedClients.length * 20 + openTasks.length * 10 + overdueDeliverables.length * 25;
            const workloadTier =
              workloadIndex > 70 ? 'Heavy Load' : workloadIndex > 35 ? 'Balanced' : 'Available Capacity';

            return (
              <div
                key={member.id}
                className="p-5 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-2xs space-y-4 hover:border-[#171717] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Monogram & Details */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1C1C1A] text-[#D7FF64] flex items-center justify-center font-mono font-bold text-sm">
                        {member.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#171717]">{member.name}</h4>
                        <div className="text-[11px] text-[#777777] font-mono leading-tight">{member.title}</div>
                      </div>
                    </div>

                    <Badge variant={workloadTier === 'Heavy Load' ? 'destructive' : workloadTier === 'Balanced' ? 'default' : 'success'}>
                      {workloadTier}
                    </Badge>
                  </div>

                  {/* Department & Contact */}
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#555555] font-mono">
                    <span>{member.department}</span>
                    <span className="flex items-center gap-1 text-[#777777]">
                      <Mail className="w-3 h-3" /> {member.email}
                    </span>
                  </div>

                  {/* Workload Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-lg bg-[#FAFAF8] border border-[#ECEAE4] text-center font-mono text-xs">
                    <div>
                      <span className="text-[9px] uppercase text-[#777777] block">Managed Accounts</span>
                      <span className="text-base font-bold text-[#171717]">{managedClients.length}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-[#777777] block">Deliverables</span>
                      <span className="text-base font-bold text-[#171717]">{memberDeliverables.length}</span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase text-[#777777] block">Overdue</span>
                      <span className={`text-base font-bold ${overdueDeliverables.length > 0 ? 'text-[#E5484D]' : 'text-[#30A46C]'}`}>
                        {overdueDeliverables.length}
                      </span>
                    </div>
                  </div>

                  {/* Assigned Client Chips */}
                  {managedClients.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-mono text-[#777777] uppercase block">
                        Assigned Client Accounts
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {managedClients.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#F7F6F2] border border-[#E6E4DE] text-[#171717]"
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E6E4DE] flex items-center justify-between text-[11px] font-mono text-[#777777]">
                  <span>Role: {member.role.replace('_', ' ').toUpperCase()}</span>
                  <span className="text-[#30A46C] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#30A46C]" /> Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
