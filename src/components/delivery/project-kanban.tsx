'use client';

import React from 'react';
import Link from 'next/link';
import { Project, ProjectStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Layers, Calendar, ArrowRight } from 'lucide-react';
import { useAgencyStore } from '@/lib/context/agency-store-context';

export function ProjectKanban() {
  const { projects, updateProject } = useAgencyStore();

  const columns: { status: ProjectStatus; label: string }[] = [
    { status: 'planning', label: 'Planning & Discovery' },
    { status: 'in_progress', label: 'Active Sprint Execution' },
    { status: 'in_review', label: 'Internal & Client Review' },
    { status: 'completed', label: 'Completed Deliverables' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const columnProjects = projects.filter((p) => p.status === col.status);

        return (
          <div
            key={col.status}
            className="rounded-xl border border-[#E6E4DE] bg-[#FAFAF8] p-3 flex flex-col min-h-[500px]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E4DE] mb-3">
              <span className="text-xs font-semibold text-[#171717]">{col.label}</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E6E4DE] text-[#777777]">
                {columnProjects.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnProjects.length === 0 ? (
                <div className="py-12 text-center text-[11px] text-[#999999]">
                  No projects in this stage
                </div>
              ) : (
                columnProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-3.5 bg-[#FFFFFF] rounded-lg border border-[#E6E4DE] shadow-2xs hover:border-[#171717] transition-all space-y-2.5"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase text-[#777777]">
                        {proj.client_name}
                      </span>
                      <h4 className="text-xs font-semibold text-[#171717] leading-tight">
                        {proj.name}
                      </h4>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#777777]">
                        <span>Progress:</span>
                        <span className="font-semibold text-[#171717]">{proj.progress_percent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F2EFE9] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1C1C1A] rounded-full"
                          style={{ width: `${proj.progress_percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Services Tags */}
                    <div className="flex flex-wrap gap-1">
                      {proj.services.map((svc, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-[#F7F6F2] border border-[#E6E4DE] text-[#666666]"
                        >
                          {svc}
                        </span>
                      ))}
                    </div>

                    {/* Meta: Budget and Deadlines */}
                    <div className="pt-2 border-t border-[#ECEAE4] flex items-center justify-between text-[10px] font-mono text-[#777777]">
                      <span>Budget: {formatCurrency(proj.budget)}</span>
                      <span>Due: {formatDate(proj.deadline, 'MMM dd')}</span>
                    </div>

                    {/* State change selector */}
                    <div className="pt-1 flex items-center justify-between">
                      <select
                        value={proj.status}
                        onChange={(e) => updateProject(proj.id, { status: e.target.value as ProjectStatus })}
                        className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#E6E4DE] bg-[#FFFFFF] text-[#555555]"
                      >
                        <option value="planning">Planning</option>
                        <option value="in_progress">In Progress</option>
                        <option value="in_review">In Review</option>
                        <option value="completed">Completed</option>
                      </select>

                      <Link href={`/clients/${proj.client_id}`} className="text-[#777777] hover:text-[#171717]">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
