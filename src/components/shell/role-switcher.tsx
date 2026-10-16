'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ShieldCheck, ChevronDown, Check, Wifi, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, currentUser, employeeIdentity, isLoadingIdentity } = useAgencyStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const roles: { role: UserRole; title: string; desc: string }[] = [
    { role: 'admin', title: 'Administrator', desc: 'Full access to financial, billing, and system settings' },
    { role: 'management', title: 'Executive Management', desc: 'Agency health, retention analytics, and financial pulse' },
    { role: 'sales', title: 'Sales & Growth', desc: 'Lead pipeline, outreach metrics, proposal authoring' },
    { role: 'account_manager', title: 'Account Director', desc: 'Client relations, renewals, and client health tracking' },
    { role: 'project_manager', title: 'Project Producer', desc: 'Sprints, tasks, deliverable tracking and team workload' },
    { role: 'creative', title: 'Creative / Execution Team', desc: 'Design deliverables review, versions, restricted financial view' },
    { role: 'finance', title: 'Finance Controller', desc: 'Invoices, aging schedules, partial payments & expenses' },
  ];

  const displayName = isLoadingIdentity
    ? 'Checking Device...'
    : currentUser.name || 'Unknown Employee';

  const isVerified = employeeIdentity.identified;
  const deviceName = employeeIdentity.tailscale?.nodeName || (isVerified ? 'Tailscale Device' : 'Unregistered');

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] hover:bg-[#F7F6F2] transition-colors text-xs text-[#171717]"
        title={isVerified ? `Verified via Tailscale (${deviceName})` : 'Unregistered Tailscale device'}
      >
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-[#1C1C1A] text-[#D7FF64] flex items-center justify-center text-[10px] font-mono font-bold">
            {displayName.charAt(0)}
          </div>
          {/* Server-verified identity indicator dot */}
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ring-1 ring-white',
              isVerified ? 'bg-[#30A46C]' : 'bg-[#E5484D]'
            )}
          />
        </div>

        <div className="text-left hidden sm:block">
          <div className="font-semibold leading-tight text-[#171717] flex items-center gap-1.5">
            <span>{displayName}</span>
          </div>
          <div className="text-[10px] font-mono text-[#777777] uppercase leading-none">
            {isVerified ? deviceName : 'Unknown Employee'}
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#777777] ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-80 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-xl z-50 animate-fade-in py-2 overflow-hidden">
          {/* Server-Verified Tailscale Identity Card */}
          <div className="px-3 py-2.5 mx-2 mb-2 rounded-lg bg-[#F7F6F2] border border-[#E6E4DE]">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-1">
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-[#555555]" />
                Tailscale Identity
              </span>
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-normal',
                  isVerified
                    ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]'
                    : 'bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]'
                )}
              >
                {isVerified ? 'Verified Device' : 'Unregistered'}
              </span>
            </div>
            <div className="font-semibold text-sm text-[#171717]">{displayName}</div>
            <div className="text-[11px] text-[#555555] font-mono mt-0.5 flex items-center justify-between">
              <span>Node: {deviceName}</span>
              {employeeIdentity.tailscale?.ip && (
                <span className="text-[#888888]">{employeeIdentity.tailscale.ip}</span>
              )}
            </div>
            {!isVerified && (
              <div className="mt-1.5 pt-1.5 border-t border-[#E6E4DE] text-[10px] text-[#C5221F] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Device is not registered in employee registry</span>
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 border-b border-[#E6E4DE] mb-1">
            <span className="text-[10px] font-mono uppercase text-[#777777] tracking-wider">
              Simulate Role Permissions
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {roles.map((r) => {
              const isSelected = currentRole === r.role;
              return (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentRole(r.role);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-[#F7F6F2]',
                    isSelected && 'bg-[#F2EFE9] font-medium'
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      'w-4 h-4 shrink-0 mt-0.5',
                      isSelected ? 'text-[#171717]' : 'text-[#999999]'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171717]">{r.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#171717]" />}
                    </div>
                    <p className="text-[10px] text-[#777777] leading-tight mt-0.5">{r.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
