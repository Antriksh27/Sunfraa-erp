'use client';

import { ExecutionVelocityMetric } from '@/lib/reportsEngine';
import ExportCSVButton from '@/components/ExportCSVButton';
import { CSVColumn } from '@/lib/csvExport';
import { Gauge, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExecutionVelocityReportCardProps {
  velocityMetrics: ExecutionVelocityMetric[];
}

const VELOCITY_COLUMNS: CSVColumn<ExecutionVelocityMetric>[] = [
  { header: 'Project Phase', accessor: 'phase' },
  { header: 'Target SLA (Days)', accessor: 'targetSlaDays' },
  { header: 'Industry Benchmark (Days)', accessor: 'actualAvgDays' },
  { header: 'Reference Basis', accessor: () => 'Industry Standard (C&I Solar EPC)' },
  { header: 'Benchmark Status', accessor: 'status' },
];

export default function ExecutionVelocityReportCard({ velocityMetrics }: ExecutionVelocityReportCardProps) {
  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#f0f2f5] pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-purple-600" />
          <div>
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              Execution Velocity — Industry Target SLA (Reference)
            </h3>
            <p className="text-[11px] text-[#5f6570]">
              Standard solar EPC turnaround benchmarks • Live company calculation activates upon 5+ commissioned projects
            </p>
          </div>
        </div>
        <ExportCSVButton
          filename="execution_velocity_reference_benchmarks"
          columns={VELOCITY_COLUMNS}
          data={velocityMetrics}
          label="Export Reference CSV"
        />
      </div>

      <div className="space-y-3 text-xs">
        {velocityMetrics.map((item) => {
          const isOnTarget = item.status === 'On Target';
          return (
            <div
              key={item.phase}
              className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4 flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <span className="font-bold text-sm text-[#181d26]">{item.phase}</span>
                <p className="text-[11px] text-[#5f6570]">
                  Target SLA: <strong>{item.targetSlaDays} days</strong> • Benchmark Source: Industry Standard (Gujarat Rooftop)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold text-[#181d26]">{item.actualAvgDays} Days</p>
                  <span className="text-[10px] text-[#5f6570]">Industry Reference</span>
                </div>
                <span
                  className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold ${
                    isOnTarget
                      ? 'bg-[#e8f5e9] text-[#0a2e0e] border border-[#a8d8c4]'
                      : 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                  }`}
                >
                  {isOnTarget ? <CheckCircle2 className="h-3 w-3 text-[#16a34a]" /> : <AlertTriangle className="h-3 w-3 text-[#aa2d00]" />}
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
