'use client';

import Link from 'next/link';
import { AccountsDashboardData } from '@/lib/attentionSignals';
import { CreditCard, DollarSign, Clock, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';

interface AccountsHomeDashboardProps {
  data: AccountsDashboardData;
  userName: string;
}

export default function AccountsHomeDashboard({ data, userName }: AccountsHomeDashboardProps) {
  const { paymentsOverdue, noPaymentActivity15Days, todaysCollectedTotal, todaysCollectedCount, metrics } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              Accounts & Financial Ledger Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            Financial collections, milestone billings, aging balances, and tax invoice operations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <CreditCard className="h-4 w-4 text-orange-300" />
            Accounts Dashboard
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Total Pending Receivables</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
              <AlertTriangle className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-rose-700">₹{metrics.totalPendingValue.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[#9297a0]">{metrics.totalPendingCount} quotations awaiting payment</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Collected Today</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#16a34a]">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#16a34a]">₹{todaysCollectedTotal.toLocaleString()}</p>
          <p className="mt-1 text-xs text-[#9297a0]">{todaysCollectedCount} payments logged today</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Overdue (&gt; 7 Days)</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
              <Clock className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[#181d26]">{paymentsOverdue.length}</p>
          <p className="mt-1 text-xs text-[#9297a0]">Quotations needing follow-up / collection</p>
        </div>
      </div>

      {/* Main Attention Queues */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Aging Receivables */}
        <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#fafbfc] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Aging Quotations (7+ Days)</h2>
            </div>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {paymentsOverdue.length} pending
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#fafbfc]">
            {paymentsOverdue.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#9297a0]">No aging receivables requiring immediate attention.</p>
            ) : (
              paymentsOverdue.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#fafbfc] px-2 rounded-lg transition-colors">
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
                    className="shrink-0 flex items-center gap-1.5 rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#181d26] transition-all">
                    <span>Collect</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dormant / 15+ Days */}
        <div className="rounded-xl border border-[#fcab79] bg-[#fffbf9] p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#f5e9d4] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fff0eb] text-[#aa2d00]">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="font-display text-base font-bold text-[#181d26]">No Activity in 15+ Days</h2>
            </div>
            <span className="text-xs font-bold text-[#aa2d00] bg-[#fff0eb] px-3 py-1 rounded-full border border-[#fcab79]">
              {noPaymentActivity15Days.length} critical
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f5e9d4]/60">
            {noPaymentActivity15Days.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No dormant projects past 15 days.</p>
            ) : (
              noPaymentActivity15Days.map((item) => (
                <div key={item.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-white/80 px-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-[#181d26] truncate">{item.title}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${item.tagColor}`}>
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[#5f6570] truncate mt-1">{item.subtitle}</p>
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
