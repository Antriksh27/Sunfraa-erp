'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Project, Profile } from '@/types/database';
import { calculateProjectSLA } from '@/lib/slaConfig';
import { AlertTriangle, Clock, ArrowRight, UserCheck, ShieldAlert, XCircle, TrendingDown } from 'lucide-react';
import ReassignmentModal from './ReassignmentModal';
import { getProjectUrlForRole } from '@/lib/navigation';

interface ManagerAttentionListProps {
  projects: Project[];
  teamMembers: Profile[];
  canEdit: boolean;
}

interface AttentionItem {
  project: Project;
  reasons: Array<{ label: string; severity: 'critical' | 'warning'; icon: any }>;
  score: number;
}

export default function ManagerAttentionList({
  projects,
  teamMembers,
  canEdit,
}: ManagerAttentionListProps) {
  const [reassigningProject, setReassigningProject] = useState<Project | null>(null);

  // Evaluate each active project for manager attention triggers
  const attentionItems: AttentionItem[] = [];

  projects.forEach((p) => {
    if (p.stage === 'CONNECTED' || p.stage === 'CLOSED') return;

    const reasons: AttentionItem['reasons'] = [];
    let score = 0;

    // 1. SLA Check
    const sla = calculateProjectSLA(p);
    if (sla.isOverdue) {
      reasons.push({
        label: `SLA Overdue (${sla.daysInStage}d vs ${sla.slaLimitDays}d limit)`,
        severity: 'critical',
        icon: Clock,
      });
      score += 30;
    } else if (sla.isWarning) {
      reasons.push({
        label: `SLA Breaching (${sla.daysInStage}d vs ${sla.slaLimitDays}d limit)`,
        severity: 'warning',
        icon: Clock,
      });
      score += 15;
    }

    // 2. Director Rejection
    if ((p as any).director_rejection_reason) {
      reasons.push({
        label: `Director Rejected: ${(p as any).director_rejection_reason}`,
        severity: 'critical',
        icon: XCircle,
      });
      score += 40;
    }

    // 3. Margin Alert (< 15%)
    const cost = Number((p as any).total_cost || 0);
    const price = Number((p as any).system_cost || (p as any).total_amount || 0);
    if (price > 0 && cost > 0) {
      const marginPct = ((price - cost) / price) * 100;
      if (marginPct < 15) {
        reasons.push({
          label: `Low Margin Alert (${marginPct.toFixed(1)}%)`,
          severity: 'critical',
          icon: TrendingDown,
        });
        score += 25;
      }
    }

    if (reasons.length > 0) {
      attentionItems.push({ project: p, reasons, score });
    }
  });

  // Sort by score descending (most critical on top) and take top 10
  attentionItems.sort((a, b) => b.score - a.score);
  const top10Items = attentionItems.slice(0, 10);

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#aa2d00]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Top 10 High-Priority Projects Needing Manager Intervention ({attentionItems.length} flagged)
          </h3>
        </div>
      </div>

      {top10Items.length === 0 ? (
        <p className="py-8 text-center text-xs text-[#9297a0]">
          All active projects are operating smoothly within SLA turnaround limits.
        </p>
      ) : (
        <div className="space-y-3">
          {top10Items.map(({ project, reasons }, idx) => (
            <div
              key={project.id}
              className="rounded-lg border border-[#fcab79] bg-[#fff0eb]/30 p-4 space-y-2.5 text-xs transition hover:border-[#aa2d00]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#181d26]">
                      #{idx + 1} {project.client_name}
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#181d26] border border-[#e0e2e6]">
                      {project.kw_required} kW
                    </span>
                    <span className="text-[11px] text-[#5f6570]">({project.category})</span>
                  </div>
                  <p className="text-[11px] text-[#5f6570] mt-0.5">
                    Current Stage: <strong className="text-[#181d26]">{project.stage}</strong> • Assigned: {(project as any).lead_owner?.name || 'Unassigned'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setReassigningProject(project)}
                      className="flex items-center gap-1 rounded border border-[#e0e2e6] bg-white px-2.5 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#fafbfc]"
                    >
                      <UserCheck className="h-3 w-3" />
                      Reassign
                    </button>
                  )}
                  <Link
                    href={getProjectUrlForRole(project.id, 'DIRECTOR')}
                    className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d1218]"
                  >
                    Open Dossier
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Reasons list */}
              <div className="flex flex-wrap gap-2 pt-1 border-t border-[#fcab79]/50">
                {reasons.map((r, rIdx) => {
                  const Icon = r.icon;
                  return (
                    <span
                      key={rIdx}
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                        r.severity === 'critical'
                          ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {r.label}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {reassigningProject && (
        <ReassignmentModal
          projects={[reassigningProject]}
          teamMembers={teamMembers}
          onClose={() => setReassigningProject(null)}
        />
      )}
    </div>
  );
}
