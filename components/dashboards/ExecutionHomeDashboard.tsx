'use client';

import Link from 'next/link';
import { ExecutionDashboardData } from '@/lib/attentionSignals';
import { HardHat, Users, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface ExecutionHomeDashboardProps {
  data: ExecutionDashboardData;
  userName: string;
  isHeadEngineer?: boolean;
}

export default function ExecutionHomeDashboard({ data, userName, isHeadEngineer }: ExecutionHomeDashboardProps) {
  const { todaysLabourAssignments, idleIncompleteStages, metrics } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-1.5 w-1.5 rounded-full ${isHeadEngineer ? 'bg-sky-500' : 'bg-[#16a34a]'}`} />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              {isHeadEngineer ? 'Universal Engineering & Execution Control' : 'Site Execution & Contractor Operations'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            {isHeadEngineer
              ? 'Company-wide execution overview, stage progress, labour deployment, and contractor supervision.'
              : 'Active site installations, crew deployments, Daily Progress Reports (DPR), and milestone sign-offs.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={isHeadEngineer ? '/execution-overview' : '/execution'}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <HardHat className="h-4 w-4 text-[#fcab79]" />
            {isHeadEngineer ? 'Execution Overview' : 'Execution Queue'}
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Active Execution Sites</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <HardHat className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{metrics.activeSitesCount}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Approved projects currently in field execution</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Labour Deployments</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{todaysLabourAssignments.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Contractor teams actively deployed today</p>
        </div>
      </div>

      {/* Queues (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Labour Assignments */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                <Users className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Labour Deployments</h2>
            </div>
            <span className="text-xs font-bold text-[#882400] bg-[#fff0eb] px-3 py-1 rounded-full border border-[#fcab79]">
              {todaysLabourAssignments.length} active
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {todaysLabourAssignments.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No labour assignments recorded yet.</p>
            ) : (
              todaysLabourAssignments.map((item) => (
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
                    <span>Manage</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#9297a0]" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Incomplete Stages / Progress */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertCircle className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Sites In Execution</h2>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {idleIncompleteStages.length} projects
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {idleIncompleteStages.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No sites currently in execution.</p>
            ) : (
              idleIncompleteStages.map((item) => (
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
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#181d26] transition-all"
                  >
                    <span>Log Stage</span>
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
