'use client';

import Link from 'next/link';
import { SalesDashboardData } from '@/lib/attentionSignals';
import { Kanban, AlertTriangle, Calendar, ArrowRight, UserCheck, Flame, Plus, Sparkles, UserPlus } from 'lucide-react';

interface SalesHomeDashboardProps {
  data: SalesDashboardData;
  userName: string;
}

export default function SalesHomeDashboard({ data, userName }: SalesHomeDashboardProps) {
  const { leadsNeedingFollowUp, leadsAboutToGoStale, todaysScheduledSurveys } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e0e2e6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              Sales & CRM Dispatch Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            Active solar rooftop leads, survey schedules, and quotation conversion tracking.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pipeline"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e0e2e6] bg-white px-4 text-sm font-medium text-[#181d26] shadow-2xs hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
          >
            <Kanban className="h-4 w-4 text-[#5f6570]" />
            Pipeline Board
          </Link>
          <Link
            href="/pipeline/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-semibold text-white shadow-xs hover:bg-[#0d1218] transition-all border border-[#181d26]"
          >
            <UserPlus className="h-4 w-4 text-[#fcab79]" />
            Add New Lead
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">New Intake Leads</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
              <UserCheck className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#181d26]">{leadsNeedingFollowUp.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Awaiting initial qualification & review</p>
        </div>

        <div className="rounded-xl border border-[#fcab79] bg-[#fffbf9] p-5 shadow-xs hover:border-[#fcab79] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#aa2d00] uppercase tracking-wider">SLA Stale Warning</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[#aa2d00]">{leadsAboutToGoStale.length}</p>
          <p className="mt-1 text-xs text-[#aa2d00]/80 font-medium">Quotations &gt; 10 days without follow-up</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Surveys Queued</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#16a34a] border border-[#a8d8c4]">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#181d26]">{todaysScheduledSurveys.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Site visits ready for survey upload</p>
        </div>
      </div>

      {/* Main Focus Queues (2 columns) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Urgent: Stale / Follow-up Attention */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                <Flame className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Quotations Needing Follow-up</h2>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {leadsAboutToGoStale.length} leads
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {leadsAboutToGoStale.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No stale leads or aging proposals right now.</p>
            ) : (
              leadsAboutToGoStale.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#f8fafc] px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#181d26] truncate">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6570] font-mono truncate mt-1">{item.subtitle}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg border border-[#e0e2e6] bg-white px-3 py-1.5 text-xs font-bold text-[#181d26] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all shadow-2xs"
                  >
                    <span>View Deal</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#9297a0]" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scheduled Site Surveys */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                <Calendar className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Surveys Scheduled</h2>
            </div>
            <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
              {todaysScheduledSurveys.length} visits
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {todaysScheduledSurveys.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No surveys currently scheduled.</p>
            ) : (
              todaysScheduledSurveys.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#f8fafc] px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#181d26] truncate">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6570] font-mono truncate mt-1">{item.subtitle}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#181d26] transition-all"
                  >
                    <span>Upload Survey</span>
                    <ArrowRight className="h-3.5 w-3.5" />
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
