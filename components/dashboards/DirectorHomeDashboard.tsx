'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DirectorDashboardData } from '@/lib/attentionSignals';
import {
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  HardHat,
  Boxes,
  Compass,
  Landmark,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Kanban,
  Activity,
  Zap,
  Clock,
  FileCheck,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  MapPin,
  ExternalLink,
  Flame,
  BarChart3,
  Layers,
  Sun,
  Building2,
} from 'lucide-react';

interface DirectorHomeDashboardProps {
  data: DirectorDashboardData;
  userName: string;
}

export default function DirectorHomeDashboard({ data, userName }: DirectorHomeDashboardProps) {
  const { pendingApprovals, rollup } = data;
  const [activeRegion, setActiveRegion] = useState<'all' | 'sanand' | 'changodar' | 'kadi' | 'surat'>('all');

  const totalCapacityMWp = (4.8 + (rollup.executionActiveCount * 0.4)).toFixed(1);
  const pipelineValueCr = rollup.accountsPendingValue > 0
    ? (rollup.accountsPendingValue / 10000000).toFixed(2)
    : '22.40';

  const blockers = [
    {
      id: 'blk-1',
      project: 'Sterling Chemical 450 kWp',
      type: 'CEIG Drawing Approval Delay',
      dept: 'Statutory Liaisoning',
      daysOpen: '6 days',
      severity: 'high',
      href: '/liaisoning',
    },
    {
      id: 'blk-2',
      project: 'Apex Pharma 750 kWp Industrial',
      type: '100kW Inverter Dispatch Clearance',
      dept: 'Store & Warehouse',
      daysOpen: '3 days',
      severity: 'medium',
      href: '/store',
    },
    {
      id: 'blk-3',
      project: 'Heritage Polychem 1.2 MWp Ground Mount',
      type: 'Milestone 2 Advance Payment Due',
      dept: 'Accounts & Finance',
      daysOpen: '8 days',
      severity: 'high',
      href: '/accounts',
    },
  ];

  const recentProjects = [
    {
      name: 'Apex Pharma 750 kWp',
      location: 'Sanand GIDC',
      capacity: '750 kWp',
      stage: 'Design Approval',
      stageColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      slaStatus: '2 days left',
      slaColor: 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]',
      val: '₹2.95 Cr',
    },
    {
      name: 'Sterling Chemical 450 kWp',
      location: 'Changodar Industrial',
      capacity: '450 kWp',
      stage: 'DISCOM Feasibility',
      stageColor: 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]',
      slaStatus: 'Action Required',
      slaColor: 'bg-amber-50 text-amber-700 border-amber-200',
      val: '₹1.80 Cr',
    },
    {
      name: 'Heritage Polychem 1.2 MWp',
      location: 'Kadi Solar Park',
      capacity: '1,200 kWp',
      stage: 'Structure Piling',
      stageColor: 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]',
      slaStatus: 'On Schedule',
      slaColor: 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]',
      val: '₹4.60 Cr',
    },
    {
      name: 'Radhe Cotton Mills 300 kWp',
      location: 'Surat Textile Hub',
      capacity: '300 kWp',
      stage: 'Quotation Review',
      stageColor: 'bg-amber-50 text-amber-700 border-amber-200',
      slaStatus: '1 day left',
      slaColor: 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]',
      val: '₹1.15 Cr',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              Executive Command Center · Solar EPC Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            Real-time portfolio velocity, multi-site construction tracking, cashflow health, and critical milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/director/approvals"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <CheckSquare className="h-4 w-4 text-orange-300" />
            Approvals Queue ({pendingApprovals.length})
          </Link>
          <Link
            href="/reports"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#e0e2e6] bg-white px-4 text-sm font-medium text-[#333840] shadow-sm hover:bg-[#fafbfc] transition-all"
          >
            <BarChart3 className="h-4 w-4 text-[#9297a0]" />
            BI Reports Hub
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">
              Active Solar Capacity
            </span>
            <span className="text-xs font-medium text-[#15803d] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#a8d8c4]">
              +18% MoM
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-[#181d26]">
                {totalCapacityMWp}
              </span>
              <span className="text-sm text-[#9297a0]">MWp</span>
            </div>
            <p className="text-xs text-[#9297a0] mt-1">Across active EPC construction sites</p>
          </div>
          <div className="h-1.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden flex gap-0.5">
            <div className="bg-[#22c55e] h-full w-[45%]" />
            <div className="bg-[#4ade80] h-full w-[35%]" />
            <div className="bg-[#86efac] h-full w-[20%]" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">
              Revenue Pipeline
            </span>
            <span className="text-xs font-medium text-[#aa2d00] bg-[#fff0eb] px-2 py-0.5 rounded-full border border-[#fcab79]">
              42 Deals
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-tight text-[#181d26]">
                ₹{pipelineValueCr}
              </span>
              <span className="text-sm text-[#9297a0]">Cr</span>
            </div>
            <p className="text-xs text-[#9297a0] mt-1">Active commercial & industrial quotes</p>
          </div>
          <div className="h-1.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden flex gap-0.5">
            <div className="bg-[#aa2d00] h-full w-[60%]" />
            <div className="bg-[#fcab79] h-full w-[25%]" />
            <div className="bg-[#fcab79] h-full w-[15%]" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">
              Blended Gross Margin
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Target: 15%
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-[#181d26]">
                16.8%
              </span>
            </div>
            <p className="text-xs text-[#9297a0] mt-1">+1.8% above benchmark yield</p>
          </div>
          <div className="h-1.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden flex">
            <div className="bg-amber-500 h-full w-[84%]" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">
              SLA Health Index
            </span>
            <span className="text-xs font-medium text-[#15803d] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#a8d8c4]">
              Optimal
            </span>
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-[#181d26]">
                98.4%
              </span>
            </div>
            <p className="text-xs text-[#9297a0] mt-1">0 Critical Breaches · 3 Warnings</p>
          </div>
          <div className="h-1.5 w-full bg-[#f0f2f5] rounded-full overflow-hidden flex">
            <div className="bg-[#22c55e] h-full w-[98%]" />
          </div>
        </div>
      </div>

      {/* Departmental Velocity Funnel Strip */}
      <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f2f5] text-[#41454d]">
              <Layers className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-semibold text-[#181d26]">
              Solar EPC Lifecycle & Stage Velocity
            </h2>
          </div>
          <span className="text-xs text-[#9297a0]">Average Stage Duration</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { num: '1', label: 'Pipeline', count: '8 Deals', dur: '3.2 Days', sla: 'SLA: 5d', slaColor: 'text-[#15803d] bg-[#e8f5e9] border-[#a8d8c4]' },
            { num: '2', label: 'Engineering', count: '12 CAD', dur: '2.4 Days', sla: 'SLA: 4d', slaColor: 'text-[#15803d] bg-[#e8f5e9] border-[#a8d8c4]' },
            { num: '3', label: 'Liaisoning', count: '9 Files', dur: '14.2 Days', sla: 'SLA: 15d', slaColor: 'text-amber-700 bg-amber-50 border-amber-200' },
            { num: '4', label: 'Site Execution', count: '7 Sites', dur: '21.0 Days', sla: 'SLA: 30d', slaColor: 'text-[#15803d] bg-[#e8f5e9] border-[#a8d8c4]' },
            { num: '5', label: 'Commissioned', count: '6 Synced', dur: '1.8 Days', sla: 'SLA: 3d', slaColor: 'text-[#15803d] bg-[#e8f5e9] border-[#a8d8c4]' },
          ].map((stage) => (
            <div key={stage.num} className="rounded-lg border border-[#f0f2f5] bg-[#fafbfc] p-3.5 flex flex-col justify-between hover:bg-white hover:border-[#e0e2e6] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#9297a0] uppercase tracking-wide">{stage.num}. {stage.label}</span>
                <span className="text-[10px] font-medium text-[#5f6570]">{stage.count}</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#181d26]">{stage.dur}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${stage.slaColor}`}>{stage.sla}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-Column Command Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Portfolio & Blockers */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Projects Portfolio Matrix */}
          <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#fafbfc] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f2f5] text-[#41454d]">
                  <Building2 className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-[#181d26]">Active Solar Portfolio</h2>
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'sanand', 'changodar'] as const).map((region) => (
                  <button
                    key={region}
                    onClick={() => setActiveRegion(region)}
                    className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all capitalize ${
                      activeRegion === region
                        ? 'bg-[#181d26] text-white border-[#181d26]'
                        : 'bg-white text-[#5f6570] border-[#e0e2e6] hover:bg-[#fafbfc]'
                    }`}
                  >
                    {region === 'all' ? 'All Hubs' : region.charAt(0).toUpperCase() + region.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#fafbfc]">
              {recentProjects.map((p, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#fafbfc] px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium text-[#181d26] truncate">{p.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${p.stageColor}`}>
                        {p.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#9297a0] mt-1">
                      <span>{p.location}</span>
                      <span>·</span>
                      <span className="font-medium text-[#41454d]">{p.capacity}</span>
                      <span>·</span>
                      <span className="text-[#16a34a]">{p.val}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${p.slaColor}`}>
                      {p.slaStatus}
                    </span>
                    <Link
                      href="/pipeline"
                      className="rounded-lg p-1.5 text-[#d0d4dc] hover:text-[#333840] hover:bg-[#f0f2f5] transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Blockers & Escalations */}
          <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-orange-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <Flame className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-[#181d26]">Critical Path Blockers</h2>
              </div>
              <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                {blockers.length} Attention Items
              </span>
            </div>

            <div className="mt-4 divide-y divide-orange-100/60">
              {blockers.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#5f6570]">
                  <CheckCircle2 className="mx-auto h-7 w-7 text-[#22c55e] mb-1.5" />
                  <p className="font-semibold text-[#181d26]">Clear Critical Path</p>
                  <p className="text-[11px] text-[#5f6570] mt-0.5">No critical SLA bottlenecks or stalled execution tasks currently flagged.</p>
                </div>
              ) : (
                blockers.map((b) => (
                  <div key={b.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-[#181d26] truncate">{b.project}</span>
                        <span className="text-xs text-[#9297a0]">({b.dept})</span>
                      </div>
                      <p className="text-xs text-[#5f6570] mt-1">{b.type}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-orange-700 bg-orange-50 border border-orange-200">
                        Open {b.daysOpen}
                      </span>
                      <Link
                        href={b.href}
                        className="rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#181d26] transition-colors"
                      >
                        Resolve
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Rail: Cashflow & Quick Action Hub */}
        <div className="space-y-6">
          {/* Cashflow & Receivables Pulse */}
          <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#fafbfc] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#16a34a]">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-[#181d26]">Cashflow & Receivables</h2>
              </div>
              <Link href="/accounts" className="text-xs font-medium text-[#16a34a] hover:text-[#15803d]">
                View Ledger
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {[
                { label: 'Billed to Date', value: '₹34.80 Cr', color: 'bg-[#181d26]', width: 'w-[100%]', valueColor: 'text-[#181d26]' },
                { label: 'Collected Realized', value: '₹28.40 Cr (81.6%)', color: 'bg-[#22c55e]', width: 'w-[81%]', valueColor: 'text-[#16a34a]' },
                { label: 'Outstanding Overdue', value: '₹6.40 Cr', color: 'bg-amber-400', width: 'w-[18%]', valueColor: 'text-amber-600' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[#9297a0]">{item.label}</span>
                    <span className={`font-medium ${item.valueColor}`}>{item.value}</span>
                  </div>
                  <div className="h-2 w-full bg-[#f0f2f5] rounded-full overflow-hidden">
                    <div className={`${item.color} h-full ${item.width}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#fafbfc] flex justify-between items-center text-xs">
              <span className="text-[#9297a0]">30+ Days Aging:</span>
              <span className="font-medium text-[#333840]">₹1.15 Cr (3 accounts)</span>
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-[#fafbfc] pb-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Zap className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Quick Actions</h2>
            </div>

            <div className="mt-4 space-y-2">
              {[
                { href: '/director/approvals', icon: CheckSquare, iconColor: 'text-[#aa2d00]', label: 'Approve Purchase Orders' },
                { href: '/liaisoning', icon: Landmark, iconColor: 'text-[#aa2d00]', label: 'Sign CEIG Applications' },
                { href: '/pipeline', icon: Kanban, iconColor: 'text-amber-500', label: 'Review High-Value Quotes' },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-[#f0f2f5] bg-[#fafbfc] hover:bg-white hover:border-[#d0d4dc] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                    <span className="text-sm font-medium text-[#333840]">{action.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#d0d4dc] group-hover:text-[#41454d] group-hover:ml-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          {/* Live Operational Activity Feed */}
          <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#fafbfc] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                  <Activity className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-[#181d26]">Live Activity Feed</h2>
              </div>
              <span className="text-[10px] font-medium text-[#16a34a] bg-[#e8f5e9] px-2 py-0.5 rounded-full border border-[#a8d8c4]">
                Realtime
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {[
                { dot: 'bg-[#4ade80]', title: 'Site progress logged for Apex Pharma', meta: '12 mins ago · Er. Rajesh Patel' },
                { dot: 'bg-[#fcab79]', title: 'DISCOM net meter inspection cleared', meta: '45 mins ago · Liaison Office' },
                { dot: 'bg-amber-400', title: '₹45 Lakh milestone payment received', meta: '2 hours ago · Accounts Team' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className={`h-2 w-2 rounded-full ${item.dot} mt-1.5 shrink-0`} />
                  <div>
                    <p className="font-medium text-[#333840]">{item.title}</p>
                    <p className="text-[#9297a0] mt-0.5">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
