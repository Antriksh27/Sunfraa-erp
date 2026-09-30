'use client';

import { Project, PaymentMilestone } from '@/types/database';
import { Phone, Clock, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AgingReceivablesReportProps {
  projects: (Project & { lead_owner?: { name: string } | null })[];
  milestones: PaymentMilestone[];
  onRecordPayment: (milestone: PaymentMilestone, project: Project) => void;
}

interface OverdueItem {
  milestone: PaymentMilestone;
  project: Project & { lead_owner?: { name: string } | null };
  daysOverdue: number;
  bucket: 'UNDER_30' | 'DAYS_30_60' | 'DAYS_60_90' | 'OVER_90';
}

export default function AgingReceivablesReport({
  projects,
  milestones,
  onRecordPayment,
}: AgingReceivablesReportProps) {
  const now = new Date().getTime();
  const projectMap = new Map<string, Project & { lead_owner?: { name: string } | null }>();
  projects.forEach((p) => projectMap.set(p.id, p));

  // Find all pending milestones for projects that have quotation sent
  const overdueItems: OverdueItem[] = [];

  milestones.forEach((m) => {
    if (m.status === 'PENDING') {
      const proj = projectMap.get(m.project_id);
      if (proj && proj.quotation_sent_at) {
        const quoteDate = new Date(proj.quotation_sent_at).getTime();
        const days = Math.floor((now - quoteDate) / (1000 * 60 * 60 * 24));

        let bucket: OverdueItem['bucket'] = 'UNDER_30';
        if (days > 90) bucket = 'OVER_90';
        else if (days >= 60) bucket = 'DAYS_60_90';
        else if (days >= 30) bucket = 'DAYS_30_60';

        overdueItems.push({
          milestone: m,
          project: proj,
          daysOverdue: days,
          bucket,
        });
      }
    }
  });

  // Sort by days overdue descending
  overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);

  const bucketTotals = {
    UNDER_30: overdueItems.filter((i) => i.bucket === 'UNDER_30').reduce((s, i) => s + Number(i.milestone.amount), 0),
    DAYS_30_60: overdueItems.filter((i) => i.bucket === 'DAYS_30_60').reduce((s, i) => s + Number(i.milestone.amount), 0),
    DAYS_60_90: overdueItems.filter((i) => i.bucket === 'DAYS_60_90').reduce((s, i) => s + Number(i.milestone.amount), 0),
    OVER_90: overdueItems.filter((i) => i.bucket === 'OVER_90').reduce((s, i) => s + Number(i.milestone.amount), 0),
  };

  const totalOutstanding = overdueItems.reduce((s, i) => s + Number(i.milestone.amount), 0);

  return (
    <div className="space-y-6">
      {/* 4 Aging KPI Buckets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#5f6570]">
            <span className="text-xs font-semibold">&lt; 30 Days (Current)</span>
            <Clock className="h-4 w-4 text-[#aa2d00]" />
          </div>
          <p className="mt-2 text-lg font-bold text-[#181d26]">
            ₹{bucketTotals.UNDER_30.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#5f6570]">
            {overdueItems.filter((i) => i.bucket === 'UNDER_30').length} pending milestones
          </p>
        </div>

        <div className="rounded-lg border border-[#fed7aa] bg-[#fffaf5] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#9a3412]">
            <span className="text-xs font-semibold">30 – 60 Days (Aging)</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-lg font-bold text-[#7c2d12]">
            ₹{bucketTotals.DAYS_30_60.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#9a3412]">
            {overdueItems.filter((i) => i.bucket === 'DAYS_30_60').length} follow-ups due
          </p>
        </div>

        <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#991b1b]">
            <span className="text-xs font-semibold">60 – 90 Days (High Risk)</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 text-lg font-bold text-[#991b1b]">
            ₹{bucketTotals.DAYS_60_90.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#991b1b]">
            {overdueItems.filter((i) => i.bucket === 'DAYS_60_90').length} escalation cases
          </p>
        </div>

        <div className="rounded-lg border border-[#fca5a5] bg-[#fff1f2] p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#be123c]">
            <span className="text-xs font-semibold">&gt; 90 Days (Critical)</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-lg font-bold text-[#be123c]">
            ₹{bucketTotals.OVER_90.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-[#be123c]">
            {overdueItems.filter((i) => i.bucket === 'OVER_90').length} severely delayed
          </p>
        </div>
      </div>

      {/* Overdue Table */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] bg-[#fafbfc] px-5 py-3">
          <h3 className="text-xs font-bold text-[#181d26]">
            Overdue Receivables Aging Breakdown ({overdueItems.length} Milestones)
          </h3>
          <span className="text-xs font-semibold text-[#181d26]">
            Total Outstanding: ₹{totalOutstanding.toLocaleString('en-IN')}
          </span>
        </div>

        {overdueItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9297a0]">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#16a34a] mb-2" />
            <p className="font-semibold text-[#181d26]">No overdue receivables!</p>
            <p className="text-[11px] mt-0.5">All configured milestone payments are collected or current.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                <tr>
                  <th className="p-3">Client / Project</th>
                  <th className="p-3">Milestone Stage</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                  <th className="p-3 text-center">Days Overdue</th>
                  <th className="p-3">Aging Risk</th>
                  <th className="p-3">Lead Owner</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {overdueItems.map((item) => {
                  let badgeClass = 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]';
                  let badgeText = '< 30 Days';

                  if (item.bucket === 'OVER_90') {
                    badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
                    badgeText = '> 90 Days Critical';
                  } else if (item.bucket === 'DAYS_60_90') {
                    badgeClass = 'bg-red-50 text-red-700 border-red-200';
                    badgeText = '60 - 90 Days';
                  } else if (item.bucket === 'DAYS_30_60') {
                    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                    badgeText = '30 - 60 Days';
                  }

                  return (
                    <tr key={item.milestone.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-[#181d26]">{item.project.client_name}</p>
                        <p className="text-[10px] text-[#5f6570] flex items-center gap-1 mt-0.5">
                          <Phone className="h-2.5 w-2.5" />
                          {item.project.phone}
                        </p>
                      </td>
                      <td className="p-3 font-medium text-[#181d26]">
                        {item.milestone.milestone_name} ({item.milestone.percentage}%)
                      </td>
                      <td className="p-3 text-right font-bold text-[#181d26]">
                        ₹{Number(item.milestone.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center font-semibold text-[#181d26]">
                        {item.daysOverdue} days
                      </td>
                      <td className="p-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold border ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </td>
                      <td className="p-3 text-[#5f6570]">
                        {item.project.lead_owner?.name || 'Unassigned'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRecordPayment(item.milestone, item.project)}
                          className="rounded-md bg-[#181d26] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0d1218] transition-colors"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
