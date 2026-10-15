'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '@/lib/types';
import { useAgencyStore } from '@/lib/context/agency-store-context';
import { ShieldCheck, ChevronDown, Check, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitcher() {
  const { currentRole, setCurrentRole, currentUser, users } = useAgencyStore();
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E6E4DE] bg-[#FFFFFF] hover:bg-[#F7F6F2] transition-colors text-xs text-[#171717]"
      >
        <div className="w-5 h-5 rounded-full bg-[#1C1C1A] text-[#D7FF64] flex items-center justify-center text-[10px] font-mono font-bold">
          {currentUser.name.charAt(0)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="font-semibold leading-tight text-[#171717]">{currentUser.name}</div>
          <div className="text-[10px] font-mono text-[#777777] uppercase leading-none">{currentRole.replace('_', ' ')}</div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#777777] ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-11 w-72 bg-[#FFFFFF] rounded-xl border border-[#E6E4DE] shadow-xl z-50 animate-fade-in py-2 overflow-hidden">
          <div className="px-3 py-1.5 border-b border-[#E6E4DE] mb-1">
            <span className="text-[10px] font-mono uppercase text-[#777777] tracking-wider">
              Simulate Role Permissions
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto">
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
