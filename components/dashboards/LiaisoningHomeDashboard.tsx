'use client';

import Link from 'next/link';
import { LiaisoningDashboardData } from '@/lib/attentionSignals';
import { Landmark, Clock, AlertTriangle, ArrowRight, Building2 } from 'lucide-react';

interface LiaisoningHomeDashboardProps {
  data: LiaisoningDashboardData;
  userName: string;
}

export default function LiaisoningHomeDashboard({ data, userName }: LiaisoningHomeDashboardProps) {
  const { discomFollowUpsDue, stagnantApplications, metrics } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              DISCOM & CEIG Liaisoning Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            DISCOM application filings, government estimates, statutory follow-ups, and bi-directional meter synchronization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/liaisoning"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <Landmark className="h-4 w-4 text-[#fcab79]" />
            Liaisoning Queue
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#fcab79] bg-[#fffbf9] p-5 shadow-xs hover:border-[#fcab79] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#aa2d00] uppercase tracking-wider">DISCOM Follow-ups Due</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[#aa2d00]">{discomFollowUpsDue.length}</p>
          <p className="mt-1 text-xs text-[#aa2d00]/80 font-medium">Projects &gt;= 7 days since last DISCOM touchpoint</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Govt Estimate Pending</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{stagnantApplications.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Applications awaiting DISCOM estimate creation</p>
        </div>
      </div>

      {/* Queues (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DISCOM Follow-ups Due */}
        <div className="rounded-xl border border-[#fcab79] bg-[#fffbf9] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f5e9d4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">7-Day Follow-Up Alerts</h2>
            </div>
            <span className="text-xs font-bold text-[#aa2d00] bg-[#fff0eb] px-3 py-1 rounded-full border border-[#fcab79]">
              {discomFollowUpsDue.length} due
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f5e9d4]/60">
            {discomFollowUpsDue.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">All active DISCOM projects have up-to-date follow-ups.</p>
            ) : (
              discomFollowUpsDue.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/80 px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#181d26] truncate">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#9297a0] truncate mt-1">{item.subtitle}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#181d26] transition-all"
                  >
                    <span>Log Follow-up</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Govt Estimates Pending */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                <Building2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Awaiting Govt Estimates</h2>
            </div>
            <span className="text-xs font-bold text-[#882400] bg-[#fff0eb] px-3 py-1 rounded-full border border-[#fcab79]">
              {stagnantApplications.length} pending
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {stagnantApplications.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No pending estimates.</p>
            ) : (
              stagnantApplications.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#f8fafc] px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#181d26] truncate">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#9297a0] truncate mt-1">{item.subtitle}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 text-xs font-bold text-[#181d26] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all shadow-2xs"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#9297a0]" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
