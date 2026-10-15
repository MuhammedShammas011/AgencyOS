'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  FileSpreadsheet,
  Layers,
  LineChart,
  UserCheck,
  ShieldAlert,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgencyStore } from '@/lib/context/agency-store-context';

export function NavRail() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { operationalSummary, currentRole } = useAgencyStore();

  const navItems = [
    {
      label: 'Command Center',
      href: '/',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Client Universe',
      href: '/clients',
      icon: Users,
      badge: operationalSummary.at_risk_clients_count > 0 ? `${operationalSummary.at_risk_clients_count} risk` : null,
      badgeVariant: 'warning',
    },
    {
      label: 'Acquisition Intelligence',
      href: '/acquisition',
      icon: Target,
      badge: null,
    },
    {
      label: 'Proposals & Pipeline',
      href: '/proposals',
      icon: FileSpreadsheet,
      badge: operationalSummary.proposals_awaiting > 0 ? `${operationalSummary.proposals_awaiting}` : null,
      badgeVariant: 'chartreuse',
    },
    {
      label: 'Delivery Studio',
      href: '/delivery',
      icon: Layers,
      badge: operationalSummary.deliverables_overdue > 0 ? `${operationalSummary.deliverables_overdue} overdue` : null,
      badgeVariant: 'destructive',
    },
    {
      label: 'Financial Intelligence',
      href: '/financials',
      icon: LineChart,
      badge: null,
      restrictedFor: ['creative'], // Execution team restricted from financial ledger
    },
    {
      label: 'Team & Workload',
      href: '/team',
      icon: UserCheck,
      badge: null,
    },
    {
      label: 'Retention Intelligence',
      href: '/retention',
      icon: ShieldAlert,
      badge: null,
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      badge: null,
    },
    {
      label: 'Settings & Access',
      href: '/settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={cn(
        'relative bg-[#FFFFFF] border-r border-[#E6E4DE] flex flex-col justify-between transition-all duration-300 z-30 select-none shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Agency OS Monogram & Branding */}
      <div>
        <div className="h-16 flex items-center px-4 border-b border-[#E6E4DE] justify-between">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C1A] text-[#D7FF64] flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-xs border border-[#2F2F2C]">
              A<span className="text-white text-xs">O</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-sm tracking-tight text-[#171717] leading-tight">
                  AGENCY <span className="text-[#777777] font-normal">OS</span>
                </span>
                <span className="text-[10px] font-mono uppercase text-[#777777] tracking-wider">
                  Intelligence v2.4
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1 rounded-md text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9] transition-colors"
              title="Collapse Rail"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1 mt-2">
          {navItems.map((item) => {
            // Check role restriction
            if (item.restrictedFor && item.restrictedFor.includes(currentRole)) {
              return null;
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all relative',
                  isActive
                    ? 'bg-[#1C1C1A] text-[#FFFFFF] shadow-2xs font-semibold'
                    : 'text-[#555555] hover:bg-[#F7F6F2] hover:text-[#171717]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-150',
                    isActive ? 'text-[#D7FF64]' : 'text-[#777777] group-hover:text-[#171717]'
                  )}
                />

                {!collapsed && (
                  <span className="truncate flex-1 tracking-tight">
                    {item.label}
                  </span>
                )}

                {/* Subtle notification badge */}
                {!collapsed && item.badge && (
                  <span
                    className={cn(
                      'text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-medium',
                      item.badgeVariant === 'destructive' && 'bg-[#FFEBEA] text-[#E5484D]',
                      item.badgeVariant === 'warning' && 'bg-[#FFF8E6] text-[#B7791F]',
                      item.badgeVariant === 'chartreuse' && 'bg-[#D7FF64] text-[#121606]'
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Active indicator bar on collapsed */}
                {collapsed && isActive && (
                  <div className="absolute right-0 top-2 bottom-2 w-1 bg-[#D7FF64] rounded-l-sm" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer Rail Details */}
      <div className="p-3 border-t border-[#E6E4DE] bg-[#FAFAF8] space-y-2">
        {collapsed ? (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex justify-center py-1.5 rounded-md text-[#777777] hover:text-[#171717] hover:bg-[#F2EFE9] transition-colors"
            title="Expand Rail"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-[#777777] px-1 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#30A46C] animate-pulse" />
                <span>DB ACTIVE</span>
              </span>
              <span className="text-[10px] text-[#999999] uppercase">{currentRole}</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#171717] text-[#D7FF64] flex items-center justify-center font-mono text-[10px] font-bold">
                  ⚡
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-[#171717] leading-none">Studio Engine</span>
                  <span className="text-[9px] text-[#777777] font-mono leading-tight">Sync v2.4</span>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-[#777777]" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
