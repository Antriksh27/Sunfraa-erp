'use client';

import { useState } from 'react';
import { ItemMaster, ItemCategory, ItemUnit } from '@/types/database';
import { createItemMasterAction, toggleItemMasterActiveAction } from '@/app/store/actions';
import { Package, Plus, AlertTriangle, X, Check, Loader2 } from 'lucide-react';

interface ItemsMasterTableProps {
  items: ItemMaster[];
  stockMap: Map<string, number>;
  canEdit: boolean;
}

export default function ItemsMasterTable({ items, stockMap, canEdit }: ItemsMasterTableProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createItemMasterAction(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setShowAddModal(false);
    }
    setLoading(false);
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleItemMasterActiveAction(id, !current);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden space-y-4">
      <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Items Master & Technical HSN/GST Catalog ({items.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Add Item Master
          </button>
        )}
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-y border-[#e0e2e6]">
            <tr>
              <th className="p-2.5">Item Code & Name</th>
              <th className="p-2.5">Category</th>
              <th className="p-2.5">Unit</th>
              <th className="p-2.5">HSN Code</th>
              <th className="p-2.5 text-right">GST %</th>
              <th className="p-2.5 text-right">Std. Cost (₹)</th>
              <th className="p-2.5 text-right">Current Stock</th>
              <th className="p-2.5 text-right">Reorder Pt.</th>
              <th className="p-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-xs text-[#5f6570]">
                  <Package className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                  <p className="font-semibold text-[#181d26]">No Catalog Items Found</p>
                  <p className="text-[11px] text-[#5f6570] mt-1">
                    {canEdit ? 'Register your first standard inventory item or module using the "Add Item" button above.' : 'No standard items or catalog records have been registered in the system yet.'}
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const currentStock = stockMap.get(item.name) ?? 0;
                const isLow = currentStock < item.reorder_point;

                return (
                  <tr key={item.id} className="hover:bg-[#fafbfc]">
                    <td className="p-2.5">
                      <p className="font-bold text-[#181d26]">{item.name}</p>
                      <p className="text-[10px] font-mono text-[#5f6570]">{item.item_code}</p>
                    </td>
                    <td className="p-2.5">
                      <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-semibold text-[#181d26]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-[#5f6570]">{item.unit}</td>
                    <td className="p-2.5 font-mono text-[#5f6570]">{item.hsn_code || '—'}</td>
                    <td className="p-2.5 text-right font-medium text-[#181d26]">{item.gst_rate}%</td>
                    <td className="p-2.5 text-right font-semibold text-[#181d26]">
                      ₹{Number(item.standard_cost).toLocaleString('en-IN')}
                    </td>
                    <td className="p-2.5 text-right font-bold">
                      <span className={isLow ? 'text-[#aa2d00] flex items-center justify-end gap-1' : 'text-[#16a34a]'}>
                        {isLow && <AlertTriangle className="h-3 w-3" />}
                        {currentStock} {item.unit}
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-[#5f6570]">{item.reorder_point}</td>
                    <td className="p-2.5 text-right">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id, item.is_active)}
                          className="text-[11px] font-semibold text-[#aa2d00] hover:underline"
                        >
                          {item.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Add Item Master Record</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Item Code *</label>
                  <input
                    name="itemCode"
                    type="text"
                    required
                    placeholder="e.g. ITM-PNL-600W"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Category *</label>
                  <select name="category" defaultValue="PANEL" className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs">
                    <option value="PANEL">PANEL</option>
                    <option value="INVERTER">INVERTER</option>
                    <option value="STRUCTURE">STRUCTURE</option>
                    <option value="CABLE">CABLE</option>
                    <option value="BOS">BOS (Balance of System)</option>
                    <option value="CIVIL">CIVIL</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-[#181d26]">Item Description / Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="e.g. 550W Bifacial Dual-Glass Solar Modules"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Unit *</label>
                  <select name="unit" defaultValue="NOS" className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs">
                    <option value="NOS">NOS (Numbers)</option>
                    <option value="MTR">MTR (Meters)</option>
                    <option value="SET">SET</option>
                    <option value="KG">KG (Kilograms)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">HSN Code</label>
                  <input
                    name="hsnCode"
                    type="text"
                    placeholder="e.g. 85414011"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">GST Rate (%)</label>
                  <input
                    name="gstRate"
                    type="number"
                    defaultValue={12}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Standard Cost (₹)</label>
                  <input
                    name="standardCost"
                    type="number"
                    defaultValue={8500}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Reorder Point Alert</label>
                  <input
                    name="reorderPoint"
                    type="number"
                    defaultValue={20}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Min Order Qty</label>
                  <input
                    name="minOrderQty"
                    type="number"
                    defaultValue={5}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setShowAddModal(false)} className="rounded px-3 py-1 text-xs text-[#5f6570]">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="rounded bg-[#181d26] px-4 py-1 text-xs font-semibold text-white disabled:opacity-50">
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Item Master'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
