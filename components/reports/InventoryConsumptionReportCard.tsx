'use client';

import { InventoryConsumptionMetric } from '@/lib/reportsEngine';
import ExportCSVButton from '@/components/ExportCSVButton';
import { CSVColumn } from '@/lib/csvExport';
import { Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface InventoryConsumptionReportCardProps {
  consumptionMetrics: InventoryConsumptionMetric[];
}

const CONSUMPTION_COLUMNS: CSVColumn<InventoryConsumptionMetric>[] = [
  { header: 'Material / Item Name', accessor: 'itemName' },
  { header: 'Category', accessor: 'category' },
  { header: 'Unit', accessor: 'unit' },
  { header: '30-Day Dispatches', accessor: 'consumed30d' },
  { header: '60-Day Dispatches', accessor: 'consumed60d' },
  { header: '90-Day Dispatches', accessor: 'consumed90d' },
  { header: 'Current Stock Balance', accessor: 'currentStock' },
  { header: 'Reorder Safety Level', accessor: 'reorderPoint' },
  { header: 'Reorder Urgency', accessor: (c) => (c.needsReorder ? 'REORDER REQUIRED' : 'Sufficient') },
];

export default function InventoryConsumptionReportCard({
  consumptionMetrics,
}: InventoryConsumptionReportCardProps) {
  const lowStockCount = consumptionMetrics.filter((m) => m.needsReorder).length;

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-[#aa2d00]" />
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              Warehouse Inventory Consumption & 30/60/90-Day Run Rates
            </h3>
          </div>
          <p className="text-[11px] text-[#5f6570] mt-0.5">
            {lowStockCount > 0 ? (
              <span className="text-[#aa2d00] font-semibold">
                {lowStockCount} items below safety reorder threshold
              </span>
            ) : (
              <span className="text-[#16a34a] font-semibold">All warehouse materials above safety stock levels</span>
            )}
          </p>
        </div>
        <ExportCSVButton
          filename="inventory_consumption_30_60_90"
          columns={CONSUMPTION_COLUMNS}
          data={consumptionMetrics}
          label="Export Consumption CSV"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-[#e0e2e6] rounded-lg overflow-hidden">
          <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
            <tr>
              <th className="p-2.5">Item Name</th>
              <th className="p-2.5">Category</th>
              <th className="p-2.5 text-right">30d Dispatched</th>
              <th className="p-2.5 text-right">60d Dispatched</th>
              <th className="p-2.5 text-right">90d Dispatched</th>
              <th className="p-2.5 text-right">Live Stock</th>
              <th className="p-2.5 text-right">Reorder Level</th>
              <th className="p-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5]">
            {consumptionMetrics.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-[#5f6570]">
                  <Boxes className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                  <p className="font-semibold text-[#181d26]">No Inventory Consumption Data</p>
                  <p className="text-[11px] text-[#5f6570] mt-1">No material dispatches or stock movements have been tracked in the last 90 days.</p>
                </td>
              </tr>
            ) : (
              consumptionMetrics.map((item) => (
                <tr key={item.itemName} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5 font-bold text-[#181d26]">{item.itemName}</td>
                  <td className="p-2.5 text-[#5f6570]">{item.category}</td>
                  <td className="p-2.5 text-right font-medium">{item.consumed30d} {item.unit}</td>
                  <td className="p-2.5 text-right font-medium">{item.consumed60d} {item.unit}</td>
                  <td className="p-2.5 text-right font-medium">{item.consumed90d} {item.unit}</td>
                  <td className="p-2.5 text-right font-bold text-[#181d26]">{item.currentStock} {item.unit}</td>
                  <td className="p-2.5 text-right text-[#5f6570]">{item.reorderPoint} {item.unit}</td>
                  <td className="p-2.5 text-right">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        item.needsReorder
                          ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                          : 'bg-[#e8f5e9] text-[#0a2e0e]'
                      }`}
                    >
                      {item.needsReorder ? 'REORDER' : 'IN STOCK'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
