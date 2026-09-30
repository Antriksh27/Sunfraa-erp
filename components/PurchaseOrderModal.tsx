'use client';

import { useRef } from 'react';
import { PurchaseOrder } from '@/types/database';
import { Printer, X, Zap, ShieldCheck } from 'lucide-react';

interface PurchaseOrderModalProps {
  po: PurchaseOrder;
  onClose: () => void;
}

export default function PurchaseOrderModal({ po, onClose }: PurchaseOrderModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const supplier = po.supplier;
  const items = po.items || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const taxAmount = Number(po.tax_amount) || 0;
  const totalAmount = Number(po.total_amount) || (subtotal + taxAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Toolbar */}
        <div className="print:hidden flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
            <span className="text-sm font-bold text-[#181d26]">Purchase Order #{po.po_number}</span>
            <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-[#333840] uppercase">
              {po.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-md bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-[#9297a0] hover:text-[#181d26]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Purchase Order Template */}
        <div ref={printRef} className="p-8 overflow-y-auto font-sans text-xs space-y-6 text-[#181d26]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#e0e2e6] pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Sunfraa Global"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-[10px] text-[#5f6570] pt-1">
                402 Solar Heights, SG Highway, Ahmedabad, Gujarat 380054<br />
                GSTIN: <strong>24AAACS9988K1Z5</strong> • CIN: U40106GJ2020PLC112233
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold uppercase tracking-wider text-[#181d26]">
                PURCHASE ORDER
              </span>
              <p className="text-xs font-mono font-bold text-[#181d26] mt-0.5">{po.po_number}</p>
              <p className="text-[10px] text-[#5f6570] mt-1">
                Date: {new Date(po.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          {/* Supplier & Delivery Address */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#fafbfc] p-4 border border-[#f0f2f5]">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Vendor / Supplier:</span>
              <p className="text-sm font-bold text-[#181d26] mt-0.5">{supplier?.name || 'Authorized Supplier'}</p>
              <p className="text-[11px] text-[#41454d]">Attn: {supplier?.contact_person || 'Sales Department'}</p>
              <p className="text-[11px] text-[#41454d]">Phone: {supplier?.phone} • Email: {supplier?.email || 'N/A'}</p>
              <p className="text-[10px] text-[#5f6570] mt-0.5">GSTIN: {supplier?.gstin || 'Unregistered'}</p>
              <p className="text-[10px] text-[#5f6570]">Payment Terms: {supplier?.payment_terms?.replace('_', ' ') || 'NET 30'}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Ship To Warehouse:</span>
              <p className="text-sm font-bold text-[#181d26] mt-0.5">Sunfraa Central Warehouse Depot</p>
              <p className="text-[11px] text-[#41454d]">Plot 48, GIDC Industrial Estate, Changodar</p>
              <p className="text-[11px] text-[#41454d]">Ahmedabad, Gujarat 382213</p>
              <p className="text-[10px] text-[#5f6570] mt-0.5">Contact: Store & Logistics (+91 98250 99887)</p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border border-[#e0e2e6] rounded-lg overflow-hidden">
            <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">Item Description</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Unit Rate (₹)</th>
                <th className="p-2.5 text-right">Taxable (₹)</th>
                <th className="p-2.5 text-right">GST %</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {items.map((item, idx) => {
                const lineTotal = Number(item.amount);
                const lineTax = (lineTotal * item.tax_rate) / 100;
                return (
                  <tr key={item.id} className="hover:bg-[#fafbfc]">
                    <td className="p-2.5 text-[#5f6570]">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-[#181d26]">{item.item_name}</td>
                    <td className="p-2.5 text-right font-medium">{item.quantity}</td>
                    <td className="p-2.5 text-right text-[#5f6570]">₹{Number(item.unit_price).toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right font-medium">₹{lineTotal.toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-right text-[#5f6570]">{item.tax_rate}%</td>
                    <td className="p-2.5 text-right font-bold text-[#181d26]">
                      ₹{(lineTotal + lineTax).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Summary Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] text-xs">
              <div className="flex justify-between text-[#5f6570]">
                <span>Taxable Subtotal:</span>
                <span className="font-semibold text-[#181d26]">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5f6570]">
                <span>Total GST Amount:</span>
                <span className="font-semibold text-[#181d26]">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-[#e0e2e6] pt-1.5 text-sm font-bold text-[#181d26]">
                <span>Grand Total:</span>
                <span className="text-[#181d26]">₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Instructions */}
          <div className="border-t border-[#e0e2e6] pt-4 text-[10px] text-[#5f6570] space-y-1">
            <p className="font-bold text-[#181d26]">Terms & Conditions:</p>
            <p>1. Delivery must be accompanied by Original Invoice, E-Way Bill, and Manufacturer Test Certificate (MTC).</p>
            <p>2. Goods are subject to warehouse QC inspection upon arrival before GRN sign-off.</p>
            <p>3. Transit insurance is to be borne by the supplier unless agreed otherwise in writing.</p>
          </div>

          {/* Signature Blocks */}
          <div className="border-t border-[#e0e2e6] pt-8 grid grid-cols-2 gap-8 text-[11px]">
            <div className="border-t border-dashed border-[#9297a0] pt-2 text-center">
              <p className="font-bold text-[#181d26]">Authorized Signatory</p>
              <p className="text-[10px] text-[#5f6570]">Sunfraa Solar Global Ltd</p>
            </div>
            <div className="border-t border-dashed border-[#9297a0] pt-2 text-center">
              <p className="font-bold text-[#181d26]">Supplier Acceptance</p>
              <p className="text-[10px] text-[#5f6570]">Signature & Company Seal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
