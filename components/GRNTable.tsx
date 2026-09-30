'use client';

import { GoodsReceiptNote } from '@/types/database';
import { PackageCheck, FileText, CheckCircle2, User } from 'lucide-react';

interface GRNTableProps {
  grnList: (GoodsReceiptNote & {
    po?: { po_number: string; supplier?: { name: string } | null } | null;
    items?: any[];
    received_by?: { name: string } | null;
  })[];
}

export default function GRNTable({ grnList }: GRNTableProps) {
  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden space-y-4">
      <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-[#16a34a]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Goods Receipt Notes (GRN) Inward Register ({grnList.length})
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto px-4 pb-4">
        {grnList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9297a0]">
            <PackageCheck className="mx-auto h-6 w-6 text-[#9297a0] mb-2" />
            <p className="font-bold text-[#181d26]">No Goods Receipt Notes Recorded</p>
            <p className="text-[11px] mt-0.5">GRNs are created when purchase order shipments are received and verified into the warehouse.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-y border-[#e0e2e6]">
              <tr>
                <th className="p-2.5">GRN #</th>
                <th className="p-2.5">PO Ref</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Received Date</th>
                <th className="p-2.5 text-right">Items Verified</th>
                <th className="p-2.5">Received By</th>
                <th className="p-2.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {grnList.map((grn) => (
                <tr key={grn.id} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5 font-bold font-mono text-[#181d26] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                    {grn.grn_number}
                  </td>
                  <td className="p-2.5 font-mono text-[#5f6570]">{grn.po?.po_number || 'PO'}</td>
                  <td className="p-2.5 font-medium text-[#181d26]">{grn.po?.supplier?.name || 'Vendor'}</td>
                  <td className="p-2.5 text-[#5f6570]">{new Date(grn.received_date).toLocaleDateString()}</td>
                  <td className="p-2.5 text-right font-bold text-[#181d26]">{grn.items?.length || 0}</td>
                  <td className="p-2.5 text-[#5f6570]">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-[#9297a0]" />
                      {grn.received_by?.name || 'Store Officer'}
                    </span>
                  </td>
                  <td className="p-2.5 text-[#5f6570] italic">{grn.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
