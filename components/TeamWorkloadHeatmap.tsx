'use client';

import { useState } from 'react';
import { Profile, Project } from '@/types/database';
import { Users, AlertTriangle, CheckCircle2, Zap, ArrowRight, UserCheck } from 'lucide-react';
import ReassignmentModal from './ReassignmentModal';

interface TeamWorkloadHeatmapProps {
  teamMembers: Profile[];
  activeProjects: Project[];
  canEdit: boolean;
}

export default function TeamWorkloadHeatmap({
  teamMembers,
  activeProjects,
  canEdit,
}: TeamWorkloadHeatmapProps) {
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [reassigningProjects, setReassigningProjects] = useState<Project[] | null>(null);

  // Group active projects by lead_owner_id
  const projectMap = new Map<string, Project[]>();
  activeProjects.forEach((p) => {
    if (p.lead_owner_id) {
      const list = projectMap.get(p.lead_owner_id) || [];
      list.push(p);
      projectMap.set(p.lead_owner_id, list);
    }
  });

  const memberStats = teamMembers.map((m) => {
    const assigned = projectMap.get(m.id) || [];
    const totalKw = assigned.reduce((sum, p) => sum + Number(p.kw_required || 0), 0);
    const isOverloaded = assigned.length > 5;
    return {
      member: m,
      assigned,
      count: assigned.length,
      totalKw,
      isOverloaded,
    };
  });

  // Sort by count descending
  memberStats.sort((a, b) => b.count - a.count);

  const overloadedCount = memberStats.filter((m) => m.isOverloaded).length;

  return (
    <div className="space-y-6">
      {/* Overloaded Alert Banner */}
      {overloadedCount > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-[#fcab79] bg-[#fff0eb] p-4 text-xs text-[#aa2d00]">
          <AlertTriangle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <div>
            <p className="font-bold text-[#882400]">
              Team Workload Capacity Warning ({overloadedCount} members with &gt;5 concurrent active projects)
            </p>
            <p className="text-[11px] text-[#aa2d00] mt-0.5">
              Reassign active leads and project execution sites to prevent turnaround bottlenecks and SLA breaches.
            </p>
          </div>
        </div>
      )}

      {/* Heatmap Grid */}
      {memberStats.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-[#fafbfc] p-8 text-center text-xs text-[#5f6570]">
          <Users className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
          <p className="font-semibold text-[#181d26]">No Team Members Found</p>
          <p className="text-[11px] text-[#5f6570] mt-1">No operational department members or staff profiles are currently registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberStats.map(({ member, assigned, count, totalKw, isOverloaded }) => (
            <div
              key={member.id}
              className={`rounded-lg border p-4 shadow-2xs space-y-3 transition ${
                isOverloaded
                  ? 'border-[#fcab79] bg-[#fff0eb]/30 hover:border-[#aa2d00]'
                  : 'border-[#e0e2e6] bg-white hover:border-[#181d26]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#181d26]">{member.name}</h4>
                  <p className="text-[10px] text-[#5f6570] uppercase tracking-wider">
                    {member.role.replace(/_/g, ' ')}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    isOverloaded
                      ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                      : count > 0
                      ? 'bg-[#fff0eb] text-[#882400]'
                      : 'bg-[#f0f2f5] text-[#5f6570]'
                  }`}
                >
                  {count} Active Sites
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f0f2f5]">
                <span className="text-[#5f6570] flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {totalKw} kW Total Load
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="font-semibold text-[#aa2d00] hover:underline text-[11px]"
                >
                  View Sites ({count})
                </button>
              </div>

              {/* Quick Reassign Button if overloaded */}
              {canEdit && count > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setReassigningProjects(assigned)}
                    className="w-full flex items-center justify-center gap-1 rounded border border-[#e0e2e6] bg-white py-1 text-[11px] font-medium text-[#181d26] hover:bg-[#fafbfc]"
                  >
                    <UserCheck className="h-3 w-3" />
                    Reassign Workload
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Member Projects Inspection Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#181d26]">{selectedMember.name}&apos;s Active Portfolio</h3>
                <p className="text-xs text-[#5f6570]">{selectedMember.role.replace(/_/g, ' ')}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="text-xs font-semibold text-[#5f6570] hover:text-[#181d26]"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {(projectMap.get(selectedMember.id) || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-[#fafbfc] p-6 text-center text-xs text-[#5f6570]">
                  <p className="font-semibold text-[#181d26]">No Projects Assigned</p>
                  <p className="text-[11px] text-[#5f6570] mt-0.5">This team member currently has no active solar sites assigned to their portfolio.</p>
                </div>
              ) : (
                (projectMap.get(selectedMember.id) || []).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-[#e0e2e6] p-3 flex items-center justify-between hover:bg-[#fafbfc]"
                  >
                    <div>
                      <h5 className="font-bold text-[#181d26]">{p.client_name}</h5>
                      <p className="text-[11px] text-[#5f6570]">
                        {p.kw_required} kW • {p.category} • Stage: {p.stage}
                      </p>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setReassigningProjects([p]);
                        }}
                        className="rounded border border-[#e0e2e6] bg-white px-2 py-1 text-[11px] font-semibold text-[#181d26] hover:bg-[#fafbfc]"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reassignment Modal */}
      {reassigningProjects && (
        <ReassignmentModal
          projects={reassigningProjects}
          teamMembers={teamMembers}
          onClose={() => setReassigningProjects(null)}
        />
      )}
    </div>
  );
}
