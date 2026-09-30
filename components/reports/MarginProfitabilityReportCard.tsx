'use client';

import { MarginSummaryCategory } from '@/lib/reportsEngine';
import { Project, UserRole } from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import { CSVColumn } from '@/lib/csvExport';
import { TrendingUp, AlertTriangle, IndianRupee, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { getProjectUrlForRole } from '@/lib/navigation';

interface MarginProfitabilityReportCardProps {
  categories: MarginSummaryCategory[];
  overallAvgMarginPct: number;
  lowMarginProjects: Project[];
  userRole?: UserRole;
}

const MARGIN_COLUMNS: CSVColumn<MarginSummaryCategory>[] = [
  { header: 'Project Category', accessor: 'categoryLabel' },
  { header: 'Total Sites', accessor: 'projectCount' },
  { header: 'Total kW Portfolio', accessor: 'totalKw' },
  { header: 'Total Revenue (₹)', accessor: 'totalRevenue' },
  { header: 'Estimated Cost (₹)', accessor: 'totalEstimatedCost' },
  { header: 'Gross Margin %', accessor: (c) => `${c.avgMarginPct}%` },
  { header: 'Below Target (<15%)', accessor: 'lowMarginCount' },
];

export default function MarginProfitabilityReportCard({
  categories,
  overallAvgMarginPct,
  lowMarginProjects,
  userRole = 'DIRECTOR',
}: MarginProfitabilityReportCardProps) {
  return (
    <div className="card-industrial p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-[#181d26] flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#aa2d00]" />
            Gross Margin & Category Profitability
          </h3>
          <p className="text-xs text-[#5f6570]">
            Financial yield per segment: Commercial vs Residential vs Industrial.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">Overall Avg Margin</span>
            <p className="font-mono text-sm font-bold text-[#16a34a]">{overallAvgMarginPct}%</p>
          </div>
          <ExportCSVButton
            data={categories}
            columns={MARGIN_COLUMNS}
            filename="gross_margin_profitability_report.csv"
          />
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-[#e0e2e6] rounded-lg overflow-hidden">
          <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
            <tr>
              <th className="p-2.5">Category</th>
              <th className="p-2.5 text-right">Sites</th>
              <th className="p-2.5 text-right">kW Load</th>
              <th className="p-2.5 text-right">Revenue (₹)</th>
              <th className="p-2.5 text-right">Est. Cost (₹)</th>
              <th className="p-2.5 text-right">Gross Margin</th>
              <th className="p-2.5 text-right">Low-Margin Sites</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5]">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-xs text-[#5f6570]">
                  <TrendingUp className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                  <p className="font-semibold text-[#181d26]">No Profitability Data</p>
                  <p className="text-[11px] text-[#5f6570] mt-1">No completed or quoted project margins are available to analyze.</p>
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.category} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5 font-bold text-[#181d26]">{c.categoryLabel}</td>
                  <td className="p-2.5 text-right font-medium">{c.projectCount}</td>
                  <td className="p-2.5 text-right font-medium">{c.totalKw} kW</td>
                  <td className="p-2.5 text-right font-semibold text-[#181d26]">₹{c.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right text-[#5f6570]">₹{c.totalEstimatedCost.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        c.avgMarginPct >= 20
                          ? 'bg-[#e8f5e9] text-[#0a2e0e]'
                          : c.avgMarginPct >= 15
                          ? 'bg-[#fff0eb] text-[#882400]'
                          : 'bg-[#fff0eb] text-[#aa2d00]'
                      }`}
                    >
                      {c.avgMarginPct}%
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {c.lowMarginCount > 0 ? (
                      <span className="rounded bg-[#fff0eb] border border-[#fcab79] px-2 py-0.5 text-[10px] font-bold text-[#aa2d00]">
                        {c.lowMarginCount} Alert
                      </span>
                    ) : (
                      <span className="text-[#16a34a] font-semibold text-[10px]">0</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Below-Target Margin Projects Warning List or Positive Confirmation */}
      {lowMarginProjects.length > 0 ? (
        <div className="space-y-3 pt-2 border-t border-[#f0f2f5]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#aa2d00]" />
            <h4 className="font-bold text-xs text-[#882400]">
              Below-Target Margin Flagged Projects (&lt;15% gross profit margin):
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            {lowMarginProjects.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-[#fcab79] bg-[#fff0eb]/30 p-3 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-[#181d26]">{p.client_name}</span>
                  <p className="text-[11px] text-[#5f6570]">
                    {p.kw_required} kW • {p.category} • Stage: {p.stage}
                  </p>
                </div>
                <Link
                  href={getProjectUrlForRole(p.id, userRole)}
                  className="flex items-center gap-1 font-semibold text-[#aa2d00] hover:underline text-[11px]"
                >
                  {userRole === 'ACCOUNTS' ? 'Review Account Schedule' : 'Review Pricing Dossier'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#a8d8c4] bg-[#e8f5e9]/50 p-4 text-center text-xs">
          <div className="flex items-center justify-center gap-1.5 font-semibold text-[#0a2e0e]">
            <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
            All Active Projects Meet Margin Thresholds
          </div>
          <p className="text-[11px] text-[#15803d]/80 mt-0.5">
            Zero projects have been flagged with below-target gross profit margins (&lt;15%).
          </p>
        </div>
      )}
    </div>
  );
}
