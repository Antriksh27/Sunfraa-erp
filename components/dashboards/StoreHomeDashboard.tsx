'use client';

import Link from 'next/link';
import { StoreDashboardData } from '@/lib/attentionSignals';
import { Boxes, Truck, AlertCircle, ArrowRight, Package } from 'lucide-react';

interface StoreHomeDashboardProps {
  data: StoreDashboardData;
  userName: string;
}

export default function StoreHomeDashboard({ data, userName }: StoreHomeDashboardProps) {
  const { lowBOMQueue, pendingStockOutAwaitingChallan, metrics } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Welcome Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f0f2f5] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <span className="text-[11px] font-medium tracking-wide text-[#9297a0]">
              Store & Inventory Dispatch Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-[#9297a0] mt-1">
            Material BOM definitions, Purchase Orders, Goods Receipt Notes (GRN), and site delivery challans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/store"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#181d26] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#181d26] transition-all"
          >
            <Boxes className="h-4 w-4 text-[#fcab79]" />
            Store Management
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Incomplete BOMs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
              <AlertCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{lowBOMQueue.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">BOM shells with &lt; 3 items defined</p>
        </div>

        <div className="rounded-xl border border-[#f0f2f5] bg-white p-5 shadow-sm hover:shadow-md hover:border-[#e0e2e6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#9297a0]">Pending Delivery Challans</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
              <Truck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl sm:text-[28px] font-semibold tracking-tight text-[#181d26]">{pendingStockOutAwaitingChallan.length}</p>
          <p className="mt-1 text-xs text-[#5f6570] font-medium">Approved sites awaiting material dispatch challans</p>
        </div>
      </div>

      {/* Queues (2 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low BOM Queue */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Package className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Incomplete BOM Shells</h2>
            </div>
            <span className="text-xs font-bold text-orange-800 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              {lowBOMQueue.length} boms
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {lowBOMQueue.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">All project BOMs are complete with required line items.</p>
            ) : (
              lowBOMQueue.map((item) => (
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
                    <span>Add Items</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Delivery Challans */}
        <div className="rounded-xl border border-[#f0f2f5] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Truck className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-[#181d26]">Sites Awaiting Dispatch Challan</h2>
            </div>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {pendingStockOutAwaitingChallan.length} pending
            </span>
          </div>

          <div className="mt-4 divide-y divide-[#f0f2f5]">
            {pendingStockOutAwaitingChallan.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5f6570]">No pending delivery dispatches.</p>
            ) : (
              pendingStockOutAwaitingChallan.map((item) => (
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
                    <span>Dispatch</span>
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
