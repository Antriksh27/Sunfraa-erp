'use client';

import { useState } from 'react';
import { Project, Profile, ReassignmentLog } from '@/types/database';
import { calculateDepartmentSLAHealth } from '@/lib/slaConfig';
import ManagerAttentionList from '@/components/ManagerAttentionList';
import TeamWorkloadHeatmap from '@/components/TeamWorkloadHeatmap';
import DepartmentSLAIndexCard from '@/components/DepartmentSLAIndexCard';
import { ShieldAlert, Users, Activity, History, UserCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ManagerDashboardViewProps {
  projects: Project[];
  teamMembers: Profile[];
  reassignmentLogs: ReassignmentLog[];
  canEdit: boolean;
}

export default function ManagerDashboardView({
  projects,
  teamMembers,
  reassignmentLogs,
  canEdit,
}: ManagerDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'attention' | 'workload' | 'sla_health' | 'audit'>('attention');

  const slaHealthList = calculateDepartmentSLAHealth(projects);

  return (
    <div className="space-y-6">
      {/* SLA Health Snapshot Top Bar */}
      <DepartmentSLAIndexCard slaHealthList={slaHealthList} />

      {/* Tab Navigation */}
      <div className="flex border-b border-[#e0e2e6] overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('attention')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-bold transition whitespace-nowrap ${
            activeTab === 'attention'
              ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-[#aa2d00]" />
          Manager Attention Queue
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-bold transition whitespace-nowrap ${
            activeTab === 'workload'
              ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
          }`}
        >
          <Users className="h-4 w-4 text-[#aa2d00]" />
          Team Workload Heatmap ({teamMembers.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 font-bold transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-[#181d26] text-[#181d26] bg-[#fafbfc]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26]'
          }`}
        >
          <History className="h-4 w-4 text-[#16a34a]" />
          Reassignment Audit Trail ({reassignmentLogs.length})
        </button>
      </div>

      {/* TAB 1: Manager Attention List */}
      {activeTab === 'attention' && (
        <ManagerAttentionList
          projects={projects}
          teamMembers={teamMembers}
          canEdit={canEdit}
        />
      )}

      {/* TAB 2: Team Workload Heatmap */}
      {activeTab === 'workload' && (
        <TeamWorkloadHeatmap
          teamMembers={teamMembers}
          activeProjects={projects}
          canEdit={canEdit}
        />
      )}

      {/* TAB 3: Reassignment Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#16a34a]" />
              <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
                Project Ownership & Workload Reassignment Logs ({reassignmentLogs.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            {reassignmentLogs.length === 0 ? (
              <p className="py-12 text-center text-xs text-[#9297a0]">
                No workload reassignments recorded yet.
              </p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-y border-[#e0e2e6]">
                  <tr>
                    <th className="p-2.5">Date & Time</th>
                    <th className="p-2.5">Project</th>
                    <th className="p-2.5">Previous Owner</th>
                    <th className="p-2.5">New Assignee</th>
                    <th className="p-2.5">Reassignment Reason</th>
                    <th className="p-2.5">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {reassignmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#fafbfc]">
                      <td className="p-2.5 text-[#5f6570]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-2.5 font-bold text-[#181d26]">
                        {log.project?.client_name || 'Project'}
                      </td>
                      <td className="p-2.5 text-[#5f6570]">
                        {log.reassigned_from?.name || 'Unassigned'}
                      </td>
                      <td className="p-2.5 font-semibold text-[#181d26]">
                        {log.reassigned_to?.name || 'Assignee'}
                      </td>
                      <td className="p-2.5 text-[#181d26] italic">
                        &quot;{log.reassignment_reason}&quot;
                      </td>
                      <td className="p-2.5 text-[#5f6570]">
                        {log.reassigned_by?.name || 'Manager'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
