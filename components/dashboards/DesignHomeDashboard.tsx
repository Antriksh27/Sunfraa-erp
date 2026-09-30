'use client';

import Link from 'next/link';
import { DesignDashboardData } from '@/lib/attentionSignals';
import { Compass, FileCheck2, ArrowRight, Upload } from 'lucide-react';

interface DesignHomeDashboardProps {
  data: DesignDashboardData;
  userName: string;
}

export default function DesignHomeDashboard({ data, userName }: DesignHomeDashboardProps) {
  const { initialDesignQueue, ceiDrawingQueue, metrics } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              Design Studio & Engineering Dispatch
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            Initial 3D CAD engineering designs, Single Line Diagrams (SLD), and statutory CEI electrical drawing queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/design"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <Compass className="h-4 w-4 text-[#fcab79]" />
            Design Queues
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Initial Design Queue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <Compass className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{metrics.initialQueueCount}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Surveys completed awaiting initial CAD drawing</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">CEI Drawing Queue</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <FileCheck2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{metrics.ceiQueueCount}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">CEI-required projects needing single-line schematics</p>
        </div>
      </div>

      {/* Queues (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Initial CAD Design Queue */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                <Compass className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Initial Engineering Queue</h2>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              {initialDesignQueue.length} pending
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {initialDesignQueue.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No projects waiting for initial CAD drawings.</p>
            ) : (
              initialDesignQueue.map((item) => (
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
                    <span>Upload CAD</span>
                    <Upload className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CEI Electrical Drawing Queue */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">CEI Drawing Queue</h2>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {ceiDrawingQueue.length} pending
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {ceiDrawingQueue.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No CEI drawings currently pending.</p>
            ) : (
              ceiDrawingQueue.map((item) => (
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
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#7e22ce] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#6b21a8] transition-all shadow-2xs"
                  >
                    <span>Upload CEI</span>
                    <Upload className="h-3.5 w-3.5" />
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
