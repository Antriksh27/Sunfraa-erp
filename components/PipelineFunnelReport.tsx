'use client';

import { Project, ProjectStage } from '@/types/database';
import { Filter, ArrowDown, TrendingDown, Users, CheckCircle2, XCircle } from 'lucide-react';

interface PipelineFunnelReportProps {
  projects: Project[];
}

interface FunnelStep {
  key: string;
  label: string;
  stages: ProjectStage[];
  color: string;
}

const FUNNEL_STEPS: FunnelStep[] = [
  {
    key: 'LEADS',
    label: '1. Inward Leads',
    stages: ['LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE', 'PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-[#aa2d00]',
  },
  {
    key: 'SURVEY',
    label: '2. Survey Completed',
    stages: ['SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE', 'PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-cyan-500',
  },
  {
    key: 'DESIGN',
    label: '3. Engineering Design Ready',
    stages: ['DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE', 'PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-teal-500',
  },
  {
    key: 'QUOTATION',
    label: '4. Quotation Dispatched',
    stages: ['QUOTATION_SENT', 'STALE', 'PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-amber-500',
  },
  {
    key: 'PAYMENT',
    label: '5. Advance Payment Collected',
    stages: ['PAYMENT_COLLECTED', 'DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-[#22c55e]',
  },
  {
    key: 'APPROVED',
    label: '6. Director Approved',
    stages: ['DIRECTOR_APPROVED', 'EXECUTION_IN_PROGRESS', 'LIAISONING_IN_PROGRESS', 'CEI_IN_PROGRESS', 'CONNECTED'],
    color: 'bg-purple-500',
  },
  {
    key: 'CONNECTED',
    label: '7. Commissioned & Grid Connected',
    stages: ['CONNECTED'],
    color: 'bg-[#16a34a]',
  },
];

export default function PipelineFunnelReport({ projects }: PipelineFunnelReportProps) {
  const totalLeads = projects.length;
  const closedLostProjects = projects.filter((p) => p.lost_reason || p.stage === 'CLOSED');

  // Compute counts for each step in funnel
  const stepCounts = FUNNEL_STEPS.map((step) => {
    const count = projects.filter((p) => step.stages.includes(p.stage)).length;
    return {
      ...step,
      count,
    };
  });

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-6 shadow-2xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#181d26] flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#aa2d00]" />
            Sales Conversion Funnel & Stage Drop-Off Report
          </h3>
          <p className="text-[11px] text-[#5f6570] mt-0.5">
            End-to-end milestone conversion efficiency from prospective inquiry to grid commissioning
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="rounded bg-[#f0f2f5] px-2.5 py-1 text-[#181d26]">
            Total Pipeline: <span className="font-bold">{totalLeads}</span>
          </div>
          <div className="rounded bg-rose-50 px-2.5 py-1 text-rose-700 border border-rose-200">
            Lost / Closed: <span className="font-bold">{closedLostProjects.length}</span>
          </div>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {stepCounts.map((step, index) => {
          const prevCount = index === 0 ? step.count : stepCounts[index - 1].count;
          const conversionRate = prevCount > 0 ? Math.round((step.count / prevCount) * 100) : 0;
          const dropOffRate = 100 - conversionRate;
          const dropOffCount = Math.max(0, prevCount - step.count);
          const percentOfTotal = totalLeads > 0 ? Math.round((step.count / totalLeads) * 100) : 0;

          return (
            <div key={step.key} className="space-y-1.5">
              {/* Drop-off connector for steps > 0 */}
              {index > 0 && (
                <div className="flex items-center justify-between text-[11px] px-3 py-1 bg-[#f8fafc] rounded border border-[#f0f2f5]">
                  <div className="flex items-center gap-1 text-[#5f6570]">
                    <ArrowDown className="h-3 w-3 text-[#9297a0]" />
                    <span>Conversion: <strong className="text-[#181d26]">{conversionRate}%</strong> ({step.count}/{prevCount})</span>
                  </div>
                  {dropOffCount > 0 && (
                    <div className="flex items-center gap-1 text-[#aa2d00] font-medium">
                      <TrendingDown className="h-3 w-3" />
                      <span>{dropOffRate}% drop-off ({dropOffCount} lost/delayed)</span>
                    </div>
                  )}
                </div>
              )}

              {/* Stage Progress Bar */}
              <div className="flex items-center justify-between text-xs font-semibold text-[#181d26]">
                <span>{step.label}</span>
                <span>{step.count} Projects ({percentOfTotal}% of total)</span>
              </div>

              <div className="h-4 w-full overflow-hidden rounded-md bg-[#f0f2f5]">
                <div
                  className={`h-full ${step.color} transition-all duration-500 rounded-md`}
                  style={{ width: `${Math.max(4, percentOfTotal)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
