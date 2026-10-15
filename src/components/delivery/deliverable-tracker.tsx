'use client';

import React from 'react';
import { Deliverable, DeliverableStatus } from '@/lib/types';
import { formatDate, isPastDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, AlertTriangle, Layers, CheckCircle2, RotateCcw, Clock } from 'lucide-react';

interface DeliverableTrackerProps {
  deliverables: Deliverable[];
  onSelectDeliverable: (d: Deliverable) => void;
}

export function DeliverableTracker({ deliverables, onSelectDeliverable }: DeliverableTrackerProps) {
  const getStatusBadge = (status: DeliverableStatus) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">APPROVED BY CLIENT</Badge>;
      case 'revision_requested':
        return <Badge variant="destructive">REVISION REQUESTED</Badge>;
      case 'submitted_to_client':
        return <Badge variant="chartreuse">SUBMITTED TO CLIENT</Badge>;
      case 'ready_to_submit':
        return <Badge variant="default">READY TO SUBMIT</Badge>;
      case 'internal_review':
        return <Badge variant="warning">INTERNAL REVIEW</Badge>;
      case 'in_progress':
        return <Badge variant="outline">IN PROGRESS</Badge>;
      default:
        return <Badge variant="muted">NOT STARTED</Badge>;
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E6E4DE] rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFAF8] border-b border-[#E6E4DE] text-[11px] font-mono uppercase text-[#777777]">
            <tr>
              <th className="px-4 py-3">Deliverable & Type</th>
              <th className="px-4 py-3">Project & Client</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Creative Lead</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Internal Gate</th>
              <th className="px-4 py-3">Current Status</th>
              <th className="px-4 py-3 text-right">Review Gate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E4DE]">
            {deliverables.map((d) => {
              const isOverdue = d.status !== 'approved' && isPastDate(d.due_date);

              return (
                <tr
                  key={d.id}
                  onClick={() => onSelectDeliverable(d)}
                  className="hover:bg-[#F7F6F2] transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[#171717] group-hover:underline">
                      {d.title}
                    </div>
                    <div className="text-[11px] text-[#777777] font-mono">{d.deliverable_type}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium text-[#171717]">{d.client_name}</div>
                    <div className="text-[11px] text-[#777777]">{d.project_name}</div>
                  </td>

                  <td className="px-4 py-3">
                    <Badge variant="outline" className="font-mono">
                      v{d.current_version}
                    </Badge>
                  </td>

                  <td className="px-4 py-3 text-[#555555] font-medium">{d.assigned_owner_name}</td>

                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className={isOverdue ? 'text-[#E5484D] font-bold' : 'text-[#171717]'}>
                        {formatDate(d.due_date)}
                      </span>
                      {isOverdue && (
                        <span className="text-[9px] px-1 py-0.2 bg-[#FFEBEA] text-[#E5484D] rounded font-bold">
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        d.internal_review_status === 'passed'
                          ? 'bg-[#EBF8F2] text-[#23784F]'
                          : d.internal_review_status === 'changes_requested'
                          ? 'bg-[#FFEBEA] text-[#E5484D]'
                          : 'bg-[#F2EFE9] text-[#777777]'
                      }`}
                    >
                      {d.internal_review_status.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-4 py-3">{getStatusBadge(d.status)}</td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDeliverable(d);
                      }}
                      className="p-1 rounded text-[#777777] hover:text-[#171717] hover:bg-[#EFECE5]"
                      title="Inspect & Advance Gate"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
