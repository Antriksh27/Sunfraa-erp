'use client';

import { useRef } from 'react';
import { DeliveryChallan, Project, StockLedger } from '@/types/database';
import { Printer, X, Truck, CheckCircle } from 'lucide-react';

interface DeliveryChallanModalProps {
  challan: DeliveryChallan & {
    project?: Project | null;
    items?: StockLedger[];
  };
  onClose: () => void;
}

export default function DeliveryChallanModal({ challan, onClose }: DeliveryChallanModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const challanNo = `DC-${challan.id.slice(0, 8).toUpperCase()}`;
  const dispatchDate = challan.created_at
    ? new Date(challan.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const items = challan.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header Toolbar (Hidden on Print) */}
        <div className="print:hidden flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-[#ea580c]" />
            <span className="text-sm font-bold text-[#181d26]">
              Delivery Challan #{challanNo}
            </span>
            <span className="rounded bg-[#e8f5e9] text-[#15803d] border border-[#a8d8c4] px-2 py-0.5 text-[10px] font-bold uppercase">
              DISPATCHED
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
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-[#9297a0] hover:text-[#181d26]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Delivery Challan Document */}
        <div ref={printRef} className="p-8 overflow-y-auto font-sans text-xs space-y-6 text-[#181d26]">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-[#e0e2e6] pb-6">
            <div className="space-y-1">
              <img
                src="/logo.png"
                alt="Sunfraa Global"
                className="h-16 w-auto object-contain"
              />
              <p className="text-[10px] text-[#5f6570] pt-1">
                402 Solar Heights, SG Highway, Ahmedabad, Gujarat 380054<br />
                GSTIN: <strong>24AAACS9988K1Z5</strong> • CIN: U40106GJ2020PLC112233<br />
                Email: dispatch@sunfraaglobal.com • Phone: +91 79 4000 1234
              </p>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold uppercase tracking-wider text-[#181d26]">
                DELIVERY CHALLAN
              </span>
              <p className="text-[10px] text-[#5f6570]">(Issued under Rule 55 of CGST Rules, 2017)</p>
              <p className="text-xs font-mono font-bold text-[#181d26] mt-2">Challan No: {challanNo}</p>
              <p className="text-[10px] text-[#5f6570]">Date: {dispatchDate}</p>
            </div>
          </div>

          {/* Consignee & Transport Meta Details */}
          <div className="grid grid-cols-2 gap-6 bg-[#fafbfc] p-4 rounded-lg border border-[#e0e2e6]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570] block mb-1">
                Consignee / Delivery Site (To)
              </span>
              <p className="text-xs font-bold text-[#181d26]">
                {challan.project?.client_name || 'Designated Project Site'}
              </p>
              <p className="text-[11px] text-[#41454d] whitespace-pre-line mt-0.5">
                {challan.project?.address || 'Site Delivery Location'}
              </p>
              {challan.project?.kw_required && (
                <p className="text-[10px] text-[#5f6570] mt-1 font-semibold">
                  Project Capacity: {challan.project.kw_required} kW
                </p>
              )}
            </div>

            <div className="border-l border-[#e0e2e6] pl-6 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570] block mb-1">
                Transport & Transit Details
              </span>
              <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                <span className="text-[#5f6570]">Vehicle Type:</span>
                <span className="font-semibold text-[#181d26]">{challan.vehicle_type}</span>

                <span className="text-[#5f6570]">Registration No:</span>
                <span className="font-mono font-bold text-[#181d26]">{challan.registration_number}</span>

                <span className="text-[#5f6570]">Driver Name:</span>
                <span className="font-semibold text-[#181d26]">{challan.driver_name}</span>

                <span className="text-[#5f6570]">Driver Contact:</span>
                <span className="font-semibold text-[#181d26]">{challan.driver_mobile}</span>

                <span className="text-[#5f6570]">Transit Distance:</span>
                <span className="font-semibold text-[#181d26]">{challan.distance} km</span>

                <span className="text-[#5f6570]">Nature of Movement:</span>
                <span className="font-semibold text-[#181d26]">Supply for EPC Installation</span>
              </div>
            </div>
          </div>

          {/* Dispatched Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
              Particulars of Goods Dispatched
            </h4>
            <table className="w-full border-collapse border border-[#e0e2e6] text-left text-xs">
              <thead>
                <tr className="bg-[#f0f2f5] text-[10px] font-bold text-[#333840] uppercase">
                  <th className="border border-[#e0e2e6] px-3 py-2 text-center w-12">#</th>
                  <th className="border border-[#e0e2e6] px-3 py-2">Material / Item Description</th>
                  <th className="border border-[#e0e2e6] px-3 py-2 text-center w-24">Movement</th>
                  <th className="border border-[#e0e2e6] px-3 py-2 text-right w-28">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e2e6]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border border-[#e0e2e6] px-3 py-4 text-center text-[#9297a0]">
                      Solar equipment and installation materials dispatched under transit challan.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fafbfc]">
                      <td className="border border-[#e0e2e6] px-3 py-2 text-center font-mono text-[#5f6570]">
                        {idx + 1}
                      </td>
                      <td className="border border-[#e0e2e6] px-3 py-2 font-semibold text-[#181d26]">
                        {item.item_name}
                      </td>
                      <td className="border border-[#e0e2e6] px-3 py-2 text-center font-mono text-[10px] text-[#ea580c] font-bold">
                        OUT (DISPATCH)
                      </td>
                      <td className="border border-[#e0e2e6] px-3 py-2 text-right font-mono font-bold text-[#181d26]">
                        {item.quantity}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Statutory Declaration */}
          <div className="rounded border border-[#e0e2e6] bg-[#fafbfc] p-3 text-[10px] text-[#5f6570] space-y-1">
            <p className="font-bold text-[#181d26]">Statutory Transit Declaration:</p>
            <p>
              1. The goods described above are being transported for execution of turnkey Solar PV power project at
              consignee site.
            </p>
            <p>
              2. This movement does not constitute an outright retail sale and is covered under Rule 55 of Central Goods
              and Services Tax Rules, 2017.
            </p>
            <p>
              3. Any transit discrepancy or damage must be endorsed on this challan copy at the time of site delivery.
            </p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 border-t border-[#e0e2e6]">
            <div className="text-center">
              <div className="h-12 border-b border-dashed border-[#9297a0] mb-2 flex items-end justify-center">
                <span className="text-[10px] font-mono text-[#5f6570]">Verified Warehouse Dispatch</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-[#181d26]">Prepared By (Store Officer)</p>
              <p className="text-[9px] text-[#5f6570]">Sunfraa Global Logistics</p>
            </div>

            <div className="text-center">
              <div className="h-12 border-b border-dashed border-[#9297a0] mb-2 flex items-end justify-center">
                <span className="text-[10px] font-mono text-[#5f6570]">{challan.driver_name}</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-[#181d26]">Transporter / Driver</p>
              <p className="text-[9px] text-[#5f6570]">Vehicle: {challan.registration_number}</p>
            </div>

            <div className="text-center">
              <div className="h-12 border-b border-dashed border-[#9297a0] mb-2 flex items-end justify-center">
                <span className="text-[10px] font-mono text-[#9297a0]">[Site Stamp & Signature]</span>
              </div>
              <p className="text-[10px] font-bold uppercase text-[#181d26]">Received By (Site In-charge)</p>
              <p className="text-[9px] text-[#5f6570]">Date & Time of Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
