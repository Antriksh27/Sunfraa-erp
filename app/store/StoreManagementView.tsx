'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  addBOMItemAction,
  deleteBOMItemAction,
  recordStockInAction,
  createChallanAndDispatchAction,
} from '@/app/store/actions';
import {
  Boxes,
  Truck,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Search,
  FileText,
  ExternalLink,
  AlertTriangle,
  Users,
  PackageCheck,
  Printer,
} from 'lucide-react';
import {
  Project,
  BOM,
  BOMItem,
  StockLedger,
  DeliveryChallan,
  ItemMaster,
  Supplier,
  PurchaseOrder,
  GoodsReceiptNote,
} from '@/types/database';
import ExportCSVButton from '@/components/ExportCSVButton';
import SavedViewsDropdown from '@/components/SavedViewsDropdown';
import ItemsMasterTable from '@/components/ItemsMasterTable';
import SuppliersMasterTable from '@/components/SuppliersMasterTable';
import PurchaseOrdersTable from '@/components/PurchaseOrdersTable';
import GRNTable from '@/components/GRNTable';
import StatCard from '@/components/StatCard';
import DeliveryChallanModal from '@/components/DeliveryChallanModal';
import { CSVColumn } from '@/lib/csvExport';

interface StoreManagementViewProps {
  boms: (BOM & { project?: Project | null; items?: BOMItem[] })[];
  stockLedger: StockLedger[];
  recentChallans: (DeliveryChallan & { project?: Project | null })[];
  activeProjects: Project[];
  itemsMaster?: ItemMaster[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  grnList?: (GoodsReceiptNote & {
    po?: { po_number: string; supplier?: { name: string } | null } | null;
    items?: any[];
    received_by?: { name: string } | null;
  })[];
  canEdit: boolean;
}

const STORE_INVENTORY_COLUMNS: CSVColumn<{ itemName: string; totalIn: number; totalOut: number; balance: number }>[] = [
  { header: 'Item Name', accessor: 'itemName' },
  { header: 'Total Received (IN)', accessor: 'totalIn' },
  { header: 'Total Dispatched (OUT)', accessor: 'totalOut' },
  { header: 'Current Balance', accessor: 'balance' },
];

const STORE_BOMS_COLUMNS: CSVColumn<BOM & { project?: Project | null; items?: BOMItem[] }>[] = [
  { header: 'Project ID', accessor: 'project_id' },
  { header: 'Client Name', accessor: (b) => b.project?.client_name ?? '' },
  { header: 'Category', accessor: (b) => b.project?.category ?? '' },
  { header: 'kW', accessor: (b) => b.project?.kw_required ?? '' },
  { header: 'Items Count', accessor: (b) => b.items?.length ?? 0 },
  { header: 'Created Date', accessor: (b) => b.created_at ? new Date(b.created_at).toLocaleDateString() : '' },
];

const STORE_LEDGER_COLUMNS: CSVColumn<StockLedger>[] = [
  { header: 'Item Name', accessor: 'item_name' },
  { header: 'Direction', accessor: 'direction' },
  { header: 'Quantity', accessor: 'quantity' },
  { header: 'Project ID', accessor: (s) => s.project_id ?? 'Warehouse/Restock' },
  { header: 'Date', accessor: (s) => s.created_at ? new Date(s.created_at).toLocaleString() : '' },
];

export default function StoreManagementView({
  boms,
  stockLedger,
  recentChallans,
  activeProjects,
  itemsMaster = [],
  suppliers = [],
  purchaseOrders = [],
  grnList = [],
  canEdit,
}: StoreManagementViewProps) {
  const [activeTab, setActiveTab] = useState<
    'boms' | 'inventory' | 'purchase_orders' | 'grn_history' | 'items_master' | 'suppliers' | 'stock_in' | 'stock_out'
  >('boms');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected BOM for Item Builder
  const [selectedBOM, setSelectedBOM] = useState<(BOM & { project?: Project | null; items?: BOMItem[] }) | null>(
    boms[0] || null
  );

  const searchParams = useSearchParams();
  const highlightParam = searchParams ? searchParams.get('highlight') : null;

  useEffect(() => {
    if (highlightParam) {
      setActiveTab('boms');
      const targetBOM = boms.find(
        (b) => b.project_id === highlightParam || b.id === highlightParam || b.project?.id === highlightParam
      );
      if (targetBOM) {
        setSelectedBOM(targetBOM);
        const timer = setTimeout(() => {
          const el = document.getElementById(`bom-item-${targetBOM.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightParam, boms]);

  // Stock IN states
  const [stockInLoading, setStockInLoading] = useState(false);

  // Stock OUT states
  const [dispatchProjectId, setDispatchProjectId] = useState<string>(activeProjects[0]?.id || '');
  const [dispatchItems, setDispatchItems] = useState<{ itemName: string; quantity: number }[]>([
    { itemName: '545W Mono PERC Solar PV Panels', quantity: 10 },
  ]);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [selectedChallanForPrint, setSelectedChallanForPrint] = useState<(DeliveryChallan & { project?: Project | null; items?: StockLedger[] }) | null>(null);

  // Add Item to BOM form state
  const [bomItemLoading, setBomItemLoading] = useState(false);

  // Aggregate Inventory (`SUM(IN) - SUM(OUT)`)
  const stockMap = new Map<string, { totalIn: number; totalOut: number; balance: number }>();
  const stockBalanceOnlyMap = new Map<string, number>();

  stockLedger.forEach((entry) => {
    const item = stockMap.get(entry.item_name) || { totalIn: 0, totalOut: 0, balance: 0 };
    if (entry.direction === 'IN') {
      item.totalIn += entry.quantity;
      item.balance += entry.quantity;
    } else {
      item.totalOut += entry.quantity;
      item.balance -= entry.quantity;
    }
    stockMap.set(entry.item_name, item);
    stockBalanceOnlyMap.set(entry.item_name, item.balance);
  });

  const stockAggregates = Array.from(stockMap.entries()).map(([name, data]) => ({
    itemName: name,
    ...data,
  }));

  // Identify Low Stock Items
  const lowStockItems = itemsMaster.filter((itm) => {
    const balance = stockBalanceOnlyMap.get(itm.name) ?? 0;
    return itm.is_active && balance < itm.reorder_point;
  });

  // Handle Add BOM Item
  async function handleAddBOMItem(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedBOM) return;

    setBomItemLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await addBOMItemAction(selectedBOM.id, selectedBOM.project_id, formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg('Line item added to Project Bill of Materials.');
      (e.target as HTMLFormElement).reset();
    }
    setBomItemLoading(false);
  }

  // Handle Delete BOM Item
  async function handleDeleteBOMItem(itemId: string) {
    if (!selectedBOM) return;
    setError(null);
    setSuccessMsg(null);
    const res = await deleteBOMItemAction(itemId, selectedBOM.project_id);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccessMsg('BOM line item removed.');
    }
  }

  // Handle Stock IN
  async function handleStockIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStockInLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const result = await recordStockInAction(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg('Stock IN successfully logged in warehouse inventory.');
      (e.target as HTMLFormElement).reset();
    }
    setStockInLoading(false);
  }

  // Handle Stock OUT & Delivery Challan
  async function handleStockOut(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDispatchLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    formData.set('projectId', dispatchProjectId);
    formData.set('dispatchItems', JSON.stringify(dispatchItems));

    const result = await createChallanAndDispatchAction(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg('Delivery Challan generated and Stock OUT deducted atomically.');
      (e.target as HTMLFormElement).reset();
    }
    setDispatchLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Top Warehouse & Asset Valuation KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Warehouse Valuation"
          value="₹4.85 Cr"
          subtext="Total stock value in hand"
          icon={Boxes}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          badgeText="Live"
          badgeColor="bg-amber-50 text-amber-700 border-amber-200"
        />

        <StatCard
          label="Stock Health"
          value={`${stockAggregates.length} SKUs`}
          subtext={`${lowStockItems.length} items below reorder threshold`}
          icon={Package}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText={lowStockItems.length > 0 ? "Low Stock" : "Optimal"}
          badgeColor={lowStockItems.length > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"}
        />

        <StatCard
          label="Active Purchase Orders"
          value={purchaseOrders.length}
          subtext="Approved supplier POs outstanding"
          icon={FileText}
          iconBg="bg-[#fff0eb]"
          iconColor="text-[#aa2d00]"
          badgeText="POs"
          badgeColor="bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]"
        />

        <StatCard
          label="GRN Inward Receipts"
          value={grnList.length}
          subtext="Verified material receipt batches"
          icon={PackageCheck}
          iconBg="bg-[#e8f5e9]"
          iconColor="text-[#16a34a]"
          badgeText="Verified"
          badgeColor="bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]"
        />
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 rounded border border-rose-200 bg-rose-50/50 p-4 text-xs text-rose-800 shadow-2xs">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-display font-bold text-rose-950">
              Low Warehouse Stock Alert ({lowStockItems.length} items below safety reorder threshold)
            </h4>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {lowStockItems.slice(0, 4).map((itm) => (
                <span key={itm.id} className="rounded bg-white border border-rose-200 px-2 py-0.5 text-[10px] font-mono font-semibold text-rose-800">
                  {itm.name}: {stockBalanceOnlyMap.get(itm.name) ?? 0} / {itm.reorder_point} {itm.unit}
                </span>
              ))}
              {lowStockItems.length > 4 && (
                <span className="text-[10px] font-mono font-medium text-rose-700 self-center">
                  +{lowStockItems.length - 4} more items
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Errors */}
      {error && (
        <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded border border-[#a8d8c4] bg-[#e8f5e9] p-4 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Controls Bar & CSV Exports */}
      <div className="flex flex-col gap-3 rounded border border-[#e2e8f0] bg-white p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <SavedViewsDropdown
            moduleName="store"
            currentFilters={{ activeTab }}
            onApplyView={(filters) => {
              if (filters.activeTab) setActiveTab(filters.activeTab as any);
            }}
            onResetView={() => setActiveTab('boms')}
          />
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'inventory' ? (
            <ExportCSVButton
              filename="inventory_stock_balance"
              columns={STORE_INVENTORY_COLUMNS}
              data={stockAggregates}
              label="Export Inventory CSV"
            />
          ) : activeTab === 'boms' ? (
            <ExportCSVButton
              filename="project_boms"
              columns={STORE_BOMS_COLUMNS}
              data={boms}
              label="Export BOMs CSV"
            />
          ) : (
            <ExportCSVButton
              filename="stock_ledger"
              columns={STORE_LEDGER_COLUMNS}
              data={stockLedger}
              label="Export Ledger CSV"
            />
          )}
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-[#e0e2e6] overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('boms')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'boms'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>BOM Queue ({boms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Stock Balances</span>
        </button>

        <button
          onClick={() => setActiveTab('purchase_orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'purchase_orders'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('grn_history')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'grn_history'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <PackageCheck className="h-4 w-4" />
          <span>GRN Receipts ({grnList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('items_master')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'items_master'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Items Master ({itemsMaster.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'suppliers'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Suppliers ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_in')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stock_in'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <ArrowDownLeft className="h-4 w-4" />
          <span>Stock IN</span>
        </button>

        <button
          onClick={() => setActiveTab('stock_out')}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'stock_out'
              ? 'border-orange-500 text-orange-700'
              : 'border-transparent text-[#5f6570] hover:text-[#181d26] hover:border-[#d0d4dc]'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>Stock OUT & Challans</span>
        </button>
      </div>

      {/* TAB 1: Incoming BOM Queue */}
      {activeTab === 'boms' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* BOM List (1 col) */}
          <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              Project BOM Shells
            </h3>
            {boms.length === 0 ? (
              <p className="text-xs text-[#9297a0] py-4 text-center">No BOM shells created yet.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {boms.map((b) => {
                  const isHighlighted =
                    highlightParam === b.project_id ||
                    highlightParam === b.id ||
                    highlightParam === b.project?.id;

                  return (
                    <button
                      key={b.id}
                      id={`bom-item-${b.id}`}
                      onClick={() => setSelectedBOM(b)}
                      className={`w-full text-left rounded-lg p-3 text-xs transition border ${
                        isHighlighted
                          ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400 font-semibold'
                          : selectedBOM?.id === b.id
                          ? 'border-[#181d26] bg-[#fafbfc] font-semibold'
                          : 'border-[#f0f2f5] bg-white hover:bg-[#fafbfc]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#181d26]">{b.project?.client_name || 'Project'}</span>
                          {isHighlighted && (
                            <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 uppercase tracking-wider">
                              Highlighted
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#882400] bg-[#fff0eb] px-1.5 py-0.5 rounded font-bold border border-[#fcab79]">
                          {b.project?.kw_required} kW
                        </span>
                      </div>
                      <div className="text-[11px] text-[#5f6570] mt-1 flex justify-between">
                        <span>{b.project?.category?.replace(/_/g, ' ') || 'Commercial'}</span>
                        <span>{b.items?.length || 0} Items</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOM Item Builder (2 cols) */}
          <div className="lg:col-span-2 rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
            {selectedBOM ? (
              <>
                <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#181d26]">
                      BOM Items: {selectedBOM.project?.client_name}
                    </h3>
                    <p className="text-xs text-[#5f6570]">
                      {selectedBOM.project?.kw_required} kW • {selectedBOM.project?.address}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#fafbfc] border border-[#e0e2e6] px-2.5 py-0.5 text-xs font-semibold text-[#181d26]">
                    {selectedBOM.items?.length || 0} Materials
                  </span>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Material / Item</th>
                        <th className="px-3 py-2 font-semibold">Category</th>
                        <th className="px-3 py-2 font-semibold">Qty</th>
                        <th className="px-3 py-2 font-semibold">Unit</th>
                        <th className="px-3 py-2 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f2f5]">
                      {!selectedBOM.items || selectedBOM.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-xs text-[#9297a0]">
                            No BOM items added yet. Add items below.
                          </td>
                        </tr>
                      ) : (
                        selectedBOM.items.map((item) => (
                          <tr key={item.id} className="hover:bg-[#fafbfc]">
                            <td className="px-3 py-2 font-medium text-[#181d26]">{item.item_name}</td>
                            <td className="px-3 py-2 text-[#5f6570]">{item.category}</td>
                            <td className="px-3 py-2 font-bold text-[#181d26]">{item.quantity}</td>
                            <td className="px-3 py-2 text-[#5f6570]">{item.unit}</td>
                            <td className="px-3 py-2 text-right">
                              {canEdit && (
                                <button
                                  onClick={() => handleDeleteBOMItem(item.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Item Form */}
                {canEdit && (
                  <form onSubmit={handleAddBOMItem} className="rounded-lg bg-[#fafbfc] p-4 border border-[#e0e2e6] space-y-3 text-xs">
                    <h4 className="text-xs font-bold text-[#181d26]">Add Material to BOM:</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-[#181d26]">Material Name</label>
                        <input
                          name="itemName"
                          type="text"
                          required
                          placeholder="e.g. 545W Mono PERC Solar PV Panels"
                          className="mt-1 block w-full rounded border border-[#e0e2e6] bg-white p-1.5 text-xs text-[#181d26]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#181d26]">Category</label>
                        <select
                          name="category"
                          required
                          className="mt-1 block w-full rounded border border-[#e0e2e6] bg-white p-1.5 text-xs text-[#181d26]"
                        >
                          <option value="Solar Modules">Solar Modules</option>
                          <option value="Inverter">Inverter</option>
                          <option value="Structure & Rails">Structure & Rails</option>
                          <option value="Cabling & Electrical">Cabling & Electrical</option>
                          <option value="Hardware & Fasteners">Hardware & Fasteners</option>
                          <option value="Civil & Earthing">Civil & Earthing</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-semibold text-[#181d26]">Qty</label>
                          <input
                            name="quantity"
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            placeholder="10"
                            className="mt-1 block w-full rounded border border-[#e0e2e6] bg-white p-1.5 text-xs text-[#181d26]"
                          />
                        </div>
                        <div className="w-16">
                          <label className="block text-[11px] font-semibold text-[#181d26]">Unit</label>
                          <input
                            name="unit"
                            type="text"
                            required
                            defaultValue="NOS"
                            className="mt-1 block w-full rounded border border-[#e0e2e6] bg-white p-1.5 text-xs text-[#181d26]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={bomItemLoading}
                        className="flex items-center gap-1.5 rounded bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
                      >
                        {bomItemLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        Add to BOM
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-xs text-[#9297a0]">
                Select a project BOM on the left to configure materials.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Live Stock Ledger & Balances */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              Warehouse Stock Balances
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                  <tr>
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2 text-right">Total IN</th>
                    <th className="px-3 py-2 text-right">Total OUT</th>
                    <th className="px-3 py-2 text-right">Current Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {stockAggregates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-xs text-[#5f6570]">
                        <Package className="mx-auto h-7 w-7 text-[#d0d4dc] mb-2" />
                        <p className="font-semibold text-[#181d26]">No Stock Movements Recorded</p>
                        <p className="text-[11px] text-[#5f6570] mt-0.5">Inward stock via GRN or record manual adjustments to see live warehouse inventory balances.</p>
                      </td>
                    </tr>
                  ) : (
                    stockAggregates.map((s, idx) => (
                      <tr key={idx} className="hover:bg-[#fafbfc]">
                        <td className="px-3 py-2 font-bold text-[#181d26]">{s.itemName}</td>
                        <td className="px-3 py-2 text-right text-[#16a34a]">+{s.totalIn}</td>
                        <td className="px-3 py-2 text-right text-red-600">-{s.totalOut}</td>
                        <td className="px-3 py-2 text-right font-bold text-[#181d26]">{s.balance}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Purchase Orders */}
      {activeTab === 'purchase_orders' && (
        <PurchaseOrdersTable
          purchaseOrders={purchaseOrders}
          suppliers={suppliers}
          itemsMaster={itemsMaster}
          canEdit={canEdit}
        />
      )}

      {/* TAB 4: GRN Inward Register */}
      {activeTab === 'grn_history' && (
        <GRNTable grnList={grnList} />
      )}

      {/* TAB 5: Items Master & HSN */}
      {activeTab === 'items_master' && (
        <ItemsMasterTable
          items={itemsMaster}
          stockMap={stockBalanceOnlyMap}
          canEdit={canEdit}
        />
      )}

      {/* TAB 6: Suppliers Master */}
      {activeTab === 'suppliers' && (
        <SuppliersMasterTable
          suppliers={suppliers}
          canEdit={canEdit}
        />
      )}

      {/* TAB 7: Stock IN */}
      {activeTab === 'stock_in' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs max-w-xl space-y-4">
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">Log Manual Stock In (Restock)</h3>
          <form onSubmit={handleStockIn} className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#181d26]">Item Name *</label>
              <input
                name="itemName"
                type="text"
                required
                placeholder="e.g. 545W Mono PERC Solar PV Panels"
                className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#181d26]">Quantity Received *</label>
              <input
                name="quantity"
                type="number"
                min="1"
                required
                placeholder="50"
                className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={stockInLoading}
              className="rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
            >
              {stockInLoading ? 'Logging...' : 'Confirm Stock In'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 8: Stock OUT & Delivery Challans */}
      {activeTab === 'stock_out' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispatch Form (5 cols) */}
          <div className="lg:col-span-5 rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-600" />
                Issue Delivery Challan & Dispatch
              </h3>
              <p className="text-[11px] text-[#5f6570] mt-0.5">
                Generates a GST Rule 55 transit challan and logs atomic Stock OUT movements.
              </p>
            </div>

            <form onSubmit={handleStockOut} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Select Project Site *</label>
                <select
                  value={dispatchProjectId}
                  onChange={(e) => setDispatchProjectId(e.target.value)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                >
                  {activeProjects.length === 0 ? (
                    <option value="" disabled>No active projects available for dispatch</option>
                  ) : (
                    activeProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.client_name} ({p.kw_required} kW)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Vehicle Type *</label>
                  <input
                    name="vehicleType"
                    required
                    defaultValue="Tata Ace (1.5T)"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Vehicle Reg Number *</label>
                  <input
                    name="registrationNumber"
                    required
                    defaultValue="GJ-01-AB-1234"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Driver Name *</label>
                  <input
                    name="driverName"
                    required
                    defaultValue="Raju Bhai"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Driver Mobile *</label>
                  <input
                    name="driverMobile"
                    required
                    defaultValue="+91 98250 99887"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Transit Distance (km) *</label>
                <input
                  name="distance"
                  type="number"
                  required
                  defaultValue="25"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              {/* Dispatch Items Builder */}
              <div className="border-t border-[#e0e2e6] pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#181d26]">Dispatched Materials List</label>
                  <button
                    type="button"
                    onClick={() => setDispatchItems([...dispatchItems, { itemName: '', quantity: 1 }])}
                    className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {dispatchItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item.itemName}
                        placeholder="Item description"
                        onChange={(e) => {
                          const updated = [...dispatchItems];
                          updated[idx].itemName = e.target.value;
                          setDispatchItems(updated);
                        }}
                        className="h-8 flex-1 rounded border border-[#e0e2e6] px-2 text-xs"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...dispatchItems];
                          updated[idx].quantity = parseInt(e.target.value) || 1;
                          setDispatchItems(updated);
                        }}
                        className="h-8 w-20 rounded border border-[#e0e2e6] px-2 text-xs"
                        required
                      />
                      {dispatchItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setDispatchItems(dispatchItems.filter((_, i) => i !== idx))}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={dispatchLoading}
                className="w-full mt-2 rounded bg-[#181d26] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {dispatchLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating Challan...
                  </>
                ) : (
                  <>
                    <Truck className="h-3.5 w-3.5" />
                    Issue Delivery Challan & Dispatch
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Recent Challans List (7 cols) */}
          <div className="lg:col-span-7 rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  Issued Delivery Challans & Gate Passes
                </h3>
                <p className="text-[11px] text-[#5f6570]">
                  Official transit documents generated under Rule 55 CGST with print and PDF export.
                </p>
              </div>
              <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-[#333840]">
                {recentChallans.length} Challans
              </span>
            </div>

            {recentChallans.length === 0 ? (
              <div className="rounded border border-dashed border-[#e0e2e6] p-8 text-center text-xs text-[#9297a0]">
                No delivery challans issued yet. Fill out the dispatch form on the left to issue your first delivery challan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#e0e2e6] bg-[#fafbfc] text-[10px] font-bold text-[#5f6570] uppercase">
                      <th className="py-2.5 px-3">Challan No</th>
                      <th className="py-2.5 px-3">Project / Consignee</th>
                      <th className="py-2.5 px-3">Vehicle & Driver</th>
                      <th className="py-2.5 px-3 text-center">Distance</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f2f5]">
                    {recentChallans.map((challan) => {
                      const challanItems = stockLedger.filter((s) => s.delivery_challan_id === challan.id);
                      return (
                        <tr key={challan.id} className="hover:bg-[#fafbfc] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#181d26]">
                            DC-{challan.id.slice(0, 8).toUpperCase()}
                            <div className="text-[10px] font-normal text-[#5f6570]">
                              {challan.created_at ? new Date(challan.created_at).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#181d26]">
                              {challan.project?.client_name || 'Project'}
                            </div>
                            <div className="text-[10px] text-[#5f6570] line-clamp-1 max-w-xs">
                              {challan.project?.address || 'Site delivery'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-[11px] font-bold text-[#181d26]">
                              {challan.registration_number}
                            </div>
                            <div className="text-[10px] text-[#5f6570]">
                              {challan.driver_name} • {challan.vehicle_type}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-[11px] text-[#5f6570]">
                            {challan.distance} km
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedChallanForPrint({
                                  ...challan,
                                  items: challanItems,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-md border border-[#d0d4dc] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#181d26] shadow-2xs hover:bg-[#fafbfc] hover:border-[#181d26] transition-colors"
                            >
                              <Printer className="h-3 w-3 text-orange-600" />
                              View / Print
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Printable Delivery Challan Modal */}
      {selectedChallanForPrint && (
        <DeliveryChallanModal
          challan={selectedChallanForPrint}
          onClose={() => setSelectedChallanForPrint(null)}
        />
      )}
    </div>
  );
}
