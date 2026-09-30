import { Project, BOM, BOMItem } from '@/types/database';

export interface ProjectMarginBreakdown {
  revenue: number;
  estimatedBomCost: number;
  estimatedLabourCost: number;
  totalCost: number;
  grossProfit: number;
  marginPercentage: number;
  isLowMargin: boolean;
  isHealthyMargin: boolean;
}

export type ProjectWithBoms = Project & {
  boms?: (BOM & { items?: BOMItem[] })[];
};

export const BENCHMARK_BOM_PER_KW = 32000;
export const BENCHMARK_LABOUR_PER_KW = 1500;
export const BENCHMARK_REVENUE_PER_KW = 50000;
export const LOW_MARGIN_THRESHOLD_PCT = 15;
export const HEALTHY_MARGIN_THRESHOLD_PCT = 25;

/**
 * Unified calculation of commercial project margins across Sunfraa ERP.
 * Used identically in:
 * 1. Director Approvals (Project360SnapshotCard - Financial Margin Radar)
 * 2. Reports Hub (lib/reportsEngine - Margin & Profitability Summary)
 *
 * Exact Formula:
 * - Revenue: project.quotation_amount (if > 0), otherwise kw_required * ₹50,000 / kW (standard EPC benchmark)
 * - Material / BOM Cost:
 *     If BOM items are specified on the project: sum(item.quantity * ₹2,500)
 *     Else fallback: kw_required * ₹32,000 / kW (industry material benchmark)
 * - Labour & Erection Cost:
 *     kw_required * ₹1,500 / kW (standard installation & erection benchmark)
 * - Total Cost: Material / BOM Cost + Labour & Erection Cost
 * - Gross Profit: Revenue - Total Cost
 * - Margin Percentage: (Gross Profit / Revenue) * 100 (rounded)
 * - Flag: isLowMargin (< 15%), isHealthyMargin (>= 25%)
 */
export function calculateProjectMargin(project: ProjectWithBoms): ProjectMarginBreakdown {
  const kw = Number(project.kw_required) || 0;

  // 1. Revenue Determination
  const quotedAmount = Number(project.quotation_amount) || 0;
  const revenue = quotedAmount > 0 ? quotedAmount : Math.round(kw * BENCHMARK_REVENUE_PER_KW);

  // 2. Cost Determination
  // (a) Material BOM Cost
  const bom = project.boms?.[0];
  const estimatedBomCost =
    bom?.items && bom.items.length > 0
      ? bom.items.reduce((sum, item) => sum + Number(item.quantity || 0) * 2500, 0)
      : Math.round(kw * BENCHMARK_BOM_PER_KW);

  // (b) Labour Cost
  const estimatedLabourCost = Math.round(kw * BENCHMARK_LABOUR_PER_KW);

  // Total Cost
  const totalCost = estimatedBomCost + estimatedLabourCost;

  // 3. Profit & Margin Calculation
  const grossProfit = revenue > 0 ? revenue - totalCost : 0;
  const marginPercentage = revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0;

  return {
    revenue,
    estimatedBomCost,
    estimatedLabourCost,
    totalCost,
    grossProfit,
    marginPercentage,
    isLowMargin: marginPercentage < LOW_MARGIN_THRESHOLD_PCT,
    isHealthyMargin: marginPercentage >= HEALTHY_MARGIN_THRESHOLD_PCT,
  };
}
