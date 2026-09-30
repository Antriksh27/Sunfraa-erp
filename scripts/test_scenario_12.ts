import { calculateProjectMargin, ProjectWithBoms } from '../lib/marginCalculation';
import { computeMarginSummary } from '../lib/reportsEngine';

// Test Project 1: Standard Benchmark (Residential Bungalow 10kW, Quotation ₹450,000)
const testProject1 = {
  id: 'test-proj-001',
  client_name: 'Test Client Benchmark',
  phone: '9898000001',
  address: 'Surat, Gujarat',
  category: 'RESIDENTIAL_BUNGALOW',
  kw_required: 10,
  quotation_amount: 450000,
  stage: 'QUOTATION_SENT',
  payment_status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  cei_required: false,
  lead_owner_id: 'a1000001-0000-4000-8000-000000000001',
  boms: [],
} as unknown as ProjectWithBoms;

// Test Project 2: Custom BOM items (Commercial 25kW, Quotation ₹1,200,000)
const testProject2 = {
  id: 'test-proj-002',
  client_name: 'Test Client Custom BOM',
  phone: '9898000002',
  address: 'Vadodara, Gujarat',
  category: 'COMMERCIAL',
  kw_required: 25,
  quotation_amount: 1200000,
  stage: 'QUOTATION_SENT',
  payment_status: 'PARTIAL',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  cei_required: true,
  lead_owner_id: 'a1000001-0000-4000-8000-000000000001',
  boms: [
    {
      id: 'bom-001',
      project_id: 'test-proj-002',
      created_by_id: '24be7984-4c2f-4437-8e79-b55b7108cef9',
      created_at: new Date().toISOString(),
      items: [
        { id: 'bi-1', bom_id: 'bom-001', item_name: 'Mono PERC 540W', category: 'MODULE', quantity: 46, unit: 'NOS' },
        { id: 'bi-2', bom_id: 'bom-001', item_name: 'String Inverter 25kW', category: 'INVERTER', quantity: 1, unit: 'NOS' },
        { id: 'bi-3', bom_id: 'bom-001', item_name: 'Mounting Structure HDG', category: 'STRUCTURE', quantity: 100, unit: 'KG' },
      ],
    },
  ],
} as unknown as ProjectWithBoms;

// Test Project 3: Low Margin Flagged Project (8kW, Quotation ₹280,000)
const testProject3 = {
  id: 'test-proj-003',
  client_name: 'Test Low Margin Client',
  phone: '9898000003',
  address: 'Ahmedabad, Gujarat',
  category: 'RESIDENTIAL_FLAT',
  kw_required: 8,
  quotation_amount: 280000,
  stage: 'QUOTATION_SENT',
  payment_status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  cei_required: false,
  lead_owner_id: 'a1000001-0000-4000-8000-000000000001',
  boms: [],
} as unknown as ProjectWithBoms;

console.log('=== TEST SCENARIO 12: MARGIN CALCULATION PARITY VERIFICATION ===\n');

[testProject1, testProject2, testProject3].forEach((p, idx) => {
  // 1. Director Approvals Call (Project360SnapshotCard)
  const directorResult = calculateProjectMargin(p);

  // 2. Reports Hub Call (lib/reportsEngine: computeMarginSummary)
  const reportSummary = computeMarginSummary([p]);
  const catSummary = reportSummary.categories.find((c) => c.category === p.category);

  console.log(`[Project ${idx + 1}: ${p.client_name} (${p.category}, ${p.kw_required} kW, ₹${p.quotation_amount?.toLocaleString()})]`);
  console.log('Director Approvals Radar:');
  console.log(`  - Revenue: ₹${directorResult.revenue.toLocaleString()}`);
  console.log(`  - Est. BOM Cost: ₹${directorResult.estimatedBomCost.toLocaleString()}`);
  console.log(`  - Est. Labour Cost: ₹${directorResult.estimatedLabourCost.toLocaleString()}`);
  console.log(`  - Total Cost: ₹${directorResult.totalCost.toLocaleString()}`);
  console.log(`  - Gross Profit: ₹${directorResult.grossProfit.toLocaleString()}`);
  console.log(`  - Margin %: ${directorResult.marginPercentage}%`);
  console.log(`  - Low Margin Flag: ${directorResult.isLowMargin}`);

  console.log('Reports Hub Category Summary:');
  console.log(`  - Revenue: ₹${catSummary?.totalRevenue.toLocaleString()}`);
  console.log(`  - Est. Cost: ₹${catSummary?.totalEstimatedCost.toLocaleString()}`);
  console.log(`  - Gross Margin %: ${catSummary?.avgMarginPct}%`);
  console.log(`  - Low Margin Count: ${catSummary?.lowMarginCount}`);
  console.log(`  - Overall Portfolio Avg Margin %: ${reportSummary.overallAvgMarginPct}%`);

  const marginMatches = directorResult.marginPercentage === catSummary?.avgMarginPct;
  const revenueMatches = directorResult.revenue === catSummary?.totalRevenue;
  const costMatches = directorResult.totalCost === catSummary?.totalEstimatedCost;
  const parityConfirmed = marginMatches && revenueMatches && costMatches;

  console.log(`=> PARITY RESULT: ${parityConfirmed ? 'PERFECT MATCH (100% IDENTICAL)' : 'MISMATCH'}\n`);
  if (!parityConfirmed) process.exit(1);
});

console.log('All test projects verified. Parity is absolute across Director Approvals and Reports Hub.');
