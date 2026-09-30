'use client';

import { useState } from 'react';
import { PurchaseOrder } from '@/types/database';
import { createGoodsReceiptNoteAction } from '@/app/store/procurementActions';
import { PackageCheck, X, Loader2, AlertCircle } from 'lucide-react';

interface RecordGRNModalProps {
  po: PurchaseOrder;
  onClose: () => void;
}

export default function RecordGRNModal({ po, onClose }: RecordGRNModalProps) {
  const items = po.items || [];
  const [receivedMap, setReceivedMap] = useState<Record<string, { received: number; rejected: number; remarks: string }>>(
    items.reduce((acc, item) => {
      const remaining = Math.max(0, Number(item.quantity) - Number(item.quantity_received || 0));
      acc[item.id] = { received: remaining, rejected: 0, remarks: '' };
      return acc;
    }, {} as Record<string, { received: number; rejected: number; remarks: string }>)
  );
  const [grnNotes, setGrnNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const receivedPayload = items.map((item) => ({
      poItemId: item.id,
      itemName: item.item_name,
      quantityReceived: receivedMap[item.id]?.received || 0,
      quantityRejected: receivedMap[item.id]?.rejected || 0,
      remarks: receivedMap[item.id]?.remarks || undefined,
    }));

    const res = await createGoodsReceiptNoteAction(po.id, receivedPayload, grnNotes);
    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-4 w-4 text-[#16a34a]" />
            <h3 className="text-sm font-bold text-[#181d26]">Goods Receipt Note (GRN) Verification</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#9297a0] hover:text-[#181d26]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] flex justify-between">
            <div>
              <p className="font-bold text-[#181d26]">PO: {po.po_number}</p>
              <p className="text-[11px] text-[#5f6570]">Supplier: {po.supplier?.name}</p>
            </div>
            <div className="text-right">
              <span className="rounded bg-[#f5e9d4] px-2 py-0.5 text-[10px] font-bold text-[#882400]">
                {po.status}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#fff0eb] p-3 text-xs text-[#aa2d00] border border-[#fcab79]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-[#181d26]">Inspect & Receive Items into Warehouse:</h4>
            <div className="space-y-2">
              {items.map((item) => {
                const ordered = Number(item.quantity);
                const already = Number(item.quantity_received || 0);
                const current = receivedMap[item.id] || { received: 0, rejected: 0, remarks: '' };

                return (
                  <div key={item.id} className="rounded border border-[#e0e2e6] bg-white p-3 space-y-2">
                    <div className="flex justify-between items-center font-semibold text-[#181d26]">
                      <span>{item.item_name}</span>
                      <span className="text-[11px] text-[#5f6570]">
                        Ordered: {ordered} • Prev. Received: {already}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[#16a34a]">Accepted (Stock IN)</label>
                        <input
                          type="number"
                          min="0"
                          max={ordered - already}
                          value={current.received}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setReceivedMap({
                              ...receivedMap,
                              [item.id]: { ...current, received: val },
                            });
                          }}
                          className="mt-1 h-7 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#aa2d00]">Rejected (Damaged)</label>
                        <input
                          type="number"
                          min="0"
                          value={current.rejected}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setReceivedMap({
                              ...receivedMap,
                              [item.id]: { ...current, rejected: val },
                            });
                          }}
                          className="mt-1 h-7 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-[#5f6570]">Remarks / Batch #</label>
                        <input
                          type="text"
                          placeholder="e.g. Lot #891"
                          value={current.remarks}
                          onChange={(e) => {
                            setReceivedMap({
                              ...receivedMap,
                              [item.id]: { ...current, remarks: e.target.value },
                            });
                          }}
                          className="mt-1 h-7 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Warehouse Receiver Notes</label>
            <textarea
              rows={2}
              value={grnNotes}
              onChange={(e) => setGrnNotes(e.target.value)}
              placeholder="e.g. Delivery verified by Gate Officer, E-Way Bill attached."
              className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
            <button type="button" onClick={onClose} className="rounded px-3 py-1.5 font-medium text-[#5f6570]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3 w-3" />}
              Issue GRN & Auto Stock IN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
