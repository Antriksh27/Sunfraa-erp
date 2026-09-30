'use client';

import { useState } from 'react';
import { PurchaseOrder, Supplier, ItemMaster } from '@/types/database';
import { FileText, Plus, Printer, PackageCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import PurchaseOrderModal from './PurchaseOrderModal';
import CreatePOModal from './CreatePOModal';
import RecordGRNModal from './RecordGRNModal';

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  itemsMaster: ItemMaster[];
  canEdit: boolean;
}

export default function PurchaseOrdersTable({
  purchaseOrders,
  suppliers,
  itemsMaster,
  canEdit,
}: PurchaseOrdersTableProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden space-y-4">
      <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Purchase Orders & Procurement Queue ({purchaseOrders.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Issue New PO
          </button>
        )}
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        {purchaseOrders.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9297a0]">
            <FileText className="mx-auto h-6 w-6 text-[#9297a0] mb-2" />
            <p className="font-bold text-[#181d26]">No Purchase Orders Issued Yet</p>
            <p className="text-[11px] mt-0.5">Click &quot;Issue New PO&quot; to procure equipment from authorized suppliers.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-y border-[#e0e2e6]">
              <tr>
                <th className="p-2.5">PO #</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Issued Date</th>
                <th className="p-2.5 text-right">Items</th>
                <th className="p-2.5 text-right">Total Amount (₹)</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5 font-bold font-mono text-[#181d26]">{po.po_number}</td>
                  <td className="p-2.5">
                    <p className="font-medium text-[#181d26]">{po.supplier?.name || 'Supplier'}</p>
                    <p className="text-[10px] text-[#5f6570]">{po.supplier?.city}</p>
                  </td>
                  <td className="p-2.5 text-[#5f6570]">{new Date(po.issued_at).toLocaleDateString()}</td>
                  <td className="p-2.5 text-right font-medium">{po.items?.length || 0}</td>
                  <td className="p-2.5 text-right font-bold text-[#181d26]">
                    ₹{Number(po.total_amount).toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                        po.status === 'RECEIVED'
                          ? 'bg-[#e8f5e9] text-[#0a2e0e]'
                          : po.status === 'PARTIALLY_RECEIVED'
                          ? 'bg-[#fff0eb] text-[#882400]'
                          : po.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {po.status === 'RECEIVED' && <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />}
                      {po.status === 'PARTIALLY_RECEIVED' && <Clock className="h-3 w-3" />}
                      {po.status === 'CANCELLED' && <XCircle className="h-3 w-3" />}
                      {po.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-2.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setViewingPO(po)}
                      className="rounded border border-[#e0e2e6] bg-white px-2 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc]"
                    >
                      View PO
                    </button>
                    {canEdit && po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => setReceivingPO(po)}
                        className="rounded bg-[#181d26] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0d1218]"
                      >
                        Receive GRN
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Dialogs */}
      {showCreateModal && (
        <CreatePOModal
          suppliers={suppliers}
          itemsMaster={itemsMaster}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {viewingPO && (
        <PurchaseOrderModal
          po={viewingPO}
          onClose={() => setViewingPO(null)}
        />
      )}

      {receivingPO && (
        <RecordGRNModal
          po={receivingPO}
          onClose={() => setReceivingPO(null)}
        />
      )}
    </div>
  );
}
