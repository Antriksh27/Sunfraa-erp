'use client';

import { useState } from 'react';
import {
  computePipelineFunnel,
  computeAgingReceivables,
  computeExecutionVelocity,
  computeMarginSummary,
  computeInventoryConsumption,
} from '@/lib/reportsEngine';
import { Project, Invoice, StockLedger, ItemMaster, UserRole } from '@/types/database';
import PipelineFunnelReportCard from '@/components/reports/PipelineFunnelReportCard';
import AgingReceivablesReportCard from '@/components/reports/AgingReceivablesReportCard';
import ExecutionVelocityReportCard from '@/components/reports/ExecutionVelocityReportCard';
import MarginProfitabilityReportCard from '@/components/reports/MarginProfitabilityReportCard';
import InventoryConsumptionReportCard from '@/components/reports/InventoryConsumptionReportCard';
import StatCard from '@/components/StatCard';
import { Filter, Clock, Gauge, TrendingUp, Boxes } from 'lucide-react';

import { ProjectWithBoms } from '@/lib/marginCalculation';

interface ReportsHubViewProps {
  projects: ProjectWithBoms[];
  invoices: (Invoice & { project?: Project | null })[];
  stockLedger: StockLedger[];
  itemsMaster: ItemMaster[];
  userRole?: UserRole;
}

export default function ReportsHubView({
  projects,
  invoices,
  stockLedger,
  itemsMaster,
  userRole,
}: ReportsHubViewProps) {
  const [activeTab, setActiveTab] = useState<'funnel' | 'aging' | 'velocity' | 'margin' | 'consumption'>('funnel');

  const funnelMetrics = computePipelineFunnel(projects);
  const agingMetrics = computeAgingReceivables(invoices);
  const velocityMetrics = computeExecutionVelocity(projects);
  const { categories, overallAvgMarginPct, lowMarginProjects } = computeMarginSummary(projects);
  const consumptionMetrics = computeInventoryConsumption(stockLedger, itemsMaster);

  const totalVelocityDays = velocityMetrics.reduce((sum, v) => sum + v.actualAvgDays, 0).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Top BI Executive Insight Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Blended Margin"
          value={`${overallAvgMarginPct.toFixed(1)}%`}
          subtext="Target benchmark: 15.0%"
          icon={TrendingUp}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="Yield"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />

        <StatCard
          label="DSO Collections"
          value="18.4d"
          subtext="Average invoice payment cycle"
          icon={Clock}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="Active"
          badgeColor="bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]"
        />

        <StatCard
          label="Execution Velocity"
          value={`${totalVelocityDays}d`}
          subtext="Industry benchmark standard"
          icon={Gauge}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          badgeText="Reference SLA"
          badgeColor="bg-purple-50 text-purple-700 border-purple-200"
        />

        <StatCard
          label="Inventory SKUs"
          value={`${consumptionMetrics.length}`}
          subtext={`${consumptionMetrics.filter((c) => c.needsReorder).length} items need reorder`}
          icon={Boxes}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="Material Stock"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-[#e0e2e6] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('funnel')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'funnel'
              ? 'border-[#aa2d00] text-[#aa2d00]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <span>Pipeline Conversion Funnel</span>
        </button>

        <button
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'aging'
              ? 'border-[#aa2d00] text-[#aa2d00]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <span>Receivables Aging (DSO)</span>
        </button>

        <button
          onClick={() => setActiveTab('velocity')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'velocity'
              ? 'border-[#aa2d00] text-[#aa2d00]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <span>Execution Velocity Benchmarks</span>
        </button>

        <button
          onClick={() => setActiveTab('margin')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'margin'
              ? 'border-[#aa2d00] text-[#aa2d00]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <span>Category Profit Margins</span>
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'consumption'
              ? 'border-[#aa2d00] text-[#aa2d00]'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <span>Inventory Consumption Ledger</span>
        </button>
      </div>

      {/* Render Active Report */}
      {activeTab === 'funnel' && <PipelineFunnelReportCard funnelMetrics={funnelMetrics} />}
      {activeTab === 'aging' && <AgingReceivablesReportCard agingMetrics={agingMetrics} />}
      {activeTab === 'velocity' && <ExecutionVelocityReportCard velocityMetrics={velocityMetrics} />}
      {activeTab === 'margin' && (
        <MarginProfitabilityReportCard
          categories={categories}
          overallAvgMarginPct={overallAvgMarginPct}
          lowMarginProjects={lowMarginProjects}
          userRole={userRole}
        />
      )}
      {activeTab === 'consumption' && (
        <InventoryConsumptionReportCard consumptionMetrics={consumptionMetrics} />
      )}
    </div>
  );
}
