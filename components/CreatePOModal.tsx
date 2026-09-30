'use client';

import { useState } from 'react';
import { Supplier, ItemMaster } from '@/types/database';
import { createPurchaseOrderAction } from '@/app/store/procurementActions';
import { Plus, Trash2, X, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreatePOModalProps {
  suppliers: Supplier[];
  itemsMaster: ItemMaster[];
  onClose: () => void;
}

interface POLineDraft {
  itemMasterId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export default function CreatePOModal({ suppliers, itemsMaster, onClose }: CreatePOModalProps) {
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [lines, setLines] = useState<POLineDraft[]>([
    {
      itemMasterId: itemsMaster[0]?.id || '',
      itemName: itemsMaster[0]?.name || '545W Mono PERC Solar PV Panels',
      quantity: 50,
      unitPrice: itemsMaster[0]?.standard_cost || 8500,
      taxRate: itemsMaster[0]?.gst_rate || 12,
    },
  ]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAddItem() {
    const first = itemsMaster[0];
    setLines([
      ...lines,
      {
        itemMasterId: first?.id || '',
        itemName: first?.name || '',
        quantity: 10,
        unitPrice: first?.standard_cost || 0,
        taxRate: first?.gst_rate || 18,
      },
    ]);
  }

  function handleItemChange(idx: number, itemId: string) {
    const matched = itemsMaster.find((i) => i.id === itemId);
    if (!matched) return;
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      itemMasterId: matched.id,
      itemName: matched.name,
      unitPrice: matched.standard_cost,
      taxRate: matched.gst_rate,
    };
    setLines(updated);
  }

  function handleRemoveLine(idx: number) {
    setLines(lines.filter((_, i) => i !== idx));
  }

  // Compute totals
  const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const totalTax = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * l.taxRate) / 100, 0);
  const grandTotal = subtotal + totalTax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) {
      setError('Please add at least one line item.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await createPurchaseOrderAction(supplierId, lines, notes);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#181d26]" />
            <h3 className="text-sm font-bold text-[#181d26]">Create Purchase Order</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#9297a0] hover:text-[#181d26]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded bg-[#fff0eb] p-3 text-xs text-[#aa2d00] border border-[#fcab79]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Select Supplier / Vendor *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city}) • Terms: {s.payment_terms}
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#181d26]">PO Line Items ({lines.length})</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#aa2d00] hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add Item Line
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded border border-[#e0e2e6] bg-[#fafbfc] p-2">
                  <div className="flex-1">
                    <select
                      value={line.itemMasterId}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      className="h-7 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                    >
                      {itemsMaster.map((itm) => (
                        <option key={itm.id} value={itm.id}>
                          {itm.name} ({itm.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].quantity = parseFloat(e.target.value) || 0;
                        setLines(updated);
                      }}
                      className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-right"
                    />
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const updated = [...lines];
                        updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                        setLines(updated);
                      }}
                      className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-right"
                    />
                  </div>

                  <span className="w-24 text-right font-bold text-[#181d26]">
                    ₹{(line.quantity * line.unitPrice).toLocaleString('en-IN')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveLine(idx)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] space-y-1 text-right">
            <p className="text-[11px] text-[#5f6570]">
              Taxable Subtotal: <strong>₹{subtotal.toLocaleString('en-IN')}</strong>
            </p>
            <p className="text-[11px] text-[#5f6570]">
              Total Estimated GST: <strong>₹{totalTax.toLocaleString('en-IN')}</strong>
            </p>
            <p className="text-sm font-bold text-[#181d26]">
              Grand Total: ₹{grandTotal.toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Special Terms & Delivery Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery required at Changodar Warehouse within 5 business days."
              className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
            <button type="button" onClick={onClose} className="rounded px-3 py-1.5 font-medium text-[#5f6570]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || lines.length === 0}
              className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
