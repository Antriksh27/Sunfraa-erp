'use client';

import { FunnelStageMetric } from '@/lib/reportsEngine';
import ExportCSVButton from '@/components/ExportCSVButton';
import { CSVColumn } from '@/lib/csvExport';
import { Filter, Zap, Users, ArrowDown, TrendingDown } from 'lucide-react';

interface PipelineFunnelReportCardProps {
  funnelMetrics: FunnelStageMetric[];
}

const FUNNEL_COLUMNS: CSVColumn<FunnelStageMetric>[] = [
  { header: 'Funnel Stage', accessor: 'stage' },
  { header: 'Active Projects Count', accessor: 'count' },
  { header: 'Cumulative kW', accessor: 'kwTotal' },
  { header: 'Conversion Rate %', accessor: (f) => `${f.conversionFromPrevPct}%` },
  { header: 'Drop-off Count', accessor: 'dropOffCount' },
];

export default function PipelineFunnelReportCard({ funnelMetrics }: PipelineFunnelReportCardProps) {
  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#f5e9d4]">
            <Filter className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-[#181d26] uppercase tracking-wider font-mono">
            Sales Pipeline & Execution Conversion Funnel
          </h3>
        </div>
        <ExportCSVButton
          filename="pipeline_conversion_funnel"
          columns={FUNNEL_COLUMNS}
          data={funnelMetrics}
          label="Export Funnel CSV"
        />
      </div>

      {/* Visual Step Funnel */}
      <div className="space-y-3">
        {funnelMetrics.map((step, idx) => (
          <div key={step.stage} className="space-y-2">
            <div className="rounded-xl border border-[#e0e2e6] bg-[#fafbfc]/50 p-4 flex items-center justify-between hover:bg-white hover:border-[#d0d4dc] transition-all">
              <div className="space-y-1">
                <span className="font-bold text-sm text-[#181d26]">{step.stage}</span>
                <p className="text-xs text-[#5f6570] font-medium">
                  {step.count} Projects • <strong className="text-[#181d26] font-bold">{step.kwTotal} kW</strong> Portfolio Capacity
                </p>
              </div>

              <div className="text-right space-y-1">
                <span className="rounded-full bg-[#fff0eb] px-3 py-1 text-xs font-bold text-[#aa2d00] border border-[#fcab79] inline-block">
                  {step.conversionFromPrevPct}% Conversion
                </span>
                {step.dropOffCount > 0 && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center justify-end gap-1">
                    <TrendingDown className="h-3.5 w-3.5" />
                    {step.dropOffCount} dropped / stalled
                  </p>
                )}
              </div>
            </div>

            {idx < funnelMetrics.length - 1 && (
              <div className="flex justify-center text-[#9297a0]">
                <ArrowDown className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
