'use client';

import { useRef } from 'react';
import { Project, Quotation } from '@/types/database';
import { Printer, X, FileText, Send, Zap } from 'lucide-react';

interface QuotationPrintModalProps {
  quotation: Quotation;
  project: Project;
  onClose: () => void;
}

export default function QuotationPrintModal({
  quotation,
  project,
  onClose,
}: QuotationPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const lineItems = quotation.line_items || [];
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.amount) || Number(item.qty) * Number(item.rate) || 0),
    0
  );
  const gstRate = 13.8;
  const gstAmount = Math.round(((subtotal * gstRate) / 100) * 100) / 100;
  const grandTotal = Math.round(subtotal + gstAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#aa2d00]" />
            <span className="text-sm font-bold text-[#181d26]">
              Commercial Proposal & Quotation v{quotation.version}
            </span>
            <span className="rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              {quotation.status}
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

        {/* Printable Quotation Document */}
        <div ref={printRef} className="p-8 overflow-y-auto font-sans text-xs space-y-6 text-[#181d26]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#e0e2e6] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Sunfraa Global"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#5f6570]">
                Clean Energy EPC & Turnkey Commercial Solar Engineering
              </p>
              <p className="text-[10px] text-[#5f6570]">
                GSTIN: <strong>24AAACS1234F1Z5</strong> • CIN: U40106GJ2022PTC123456
              </p>
              <p className="text-[10px] text-[#5f6570]">
                Plot 42, GIDC Solar Park, Ahmedabad, Gujarat — 380015
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-[#aa2d00]">
                COMMERCIAL PROPOSAL
              </span>
              <p className="text-sm font-extrabold text-[#181d26] mt-0.5">
                QUOTE-{project.id.slice(0, 8).toUpperCase()}-V{quotation.version}
              </p>
              <p className="text-[11px] text-[#5f6570] mt-1">
                Date: {quotation.sent_at ? new Date(quotation.sent_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold text-[#16a34a] bg-[#e8f5e9] px-2 py-0.5 rounded border border-[#a8d8c4]">
                Valid for 30 Days
              </span>
            </div>
          </div>

          {/* Client & Scope Details */}
          <div className="grid grid-cols-2 gap-6 bg-[#fafbfc] p-4 rounded border border-[#f0f2f5]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">
                Prepared For:
              </span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">{project.client_name}</p>
              <p className="text-[11px] text-[#41454d] mt-0.5">{project.address}</p>
              <p className="text-[11px] text-[#41454d]">Contact: {project.phone}</p>
              {project.connection_number && (
                <p className="text-[10px] text-[#5f6570] mt-1">
                  DISCOM Connection: {project.connection_number}
                </p>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">
                System Capacity & Specifications:
              </span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">
                {project.kw_required} kWp On-Grid Solar Power Plant
              </p>
              <p className="text-[11px] text-[#41454d] mt-0.5">
                Category: {project.category.replace(/_/g, ' ')}
              </p>
              {project.sanctioned_load && (
                <p className="text-[10px] text-[#5f6570] mt-1">
                  Sanctioned Load: {project.sanctioned_load}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border border-[#e0e2e6]">
            <thead className="bg-[#f0f2f5] text-[10px] font-bold uppercase text-[#5f6570]">
              <tr>
                <th className="p-2.5 border-b border-[#e0e2e6] w-12 text-center">#</th>
                <th className="p-2.5 border-b border-[#e0e2e6]">Item Description</th>
                <th className="p-2.5 border-b border-[#e0e2e6]">Category</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-20">Qty</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-28">Rate (₹)</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-32">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              {lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 text-center text-[#5f6570]">{idx + 1}</td>
                  <td className="p-2.5 font-medium text-[#181d26]">{item.item_name}</td>
                  <td className="p-2.5 text-[#5f6570]">{item.category}</td>
                  <td className="p-2.5 text-right font-medium">{item.qty}</td>
                  <td className="p-2.5 text-right font-medium">₹{Number(item.rate).toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right font-bold text-[#181d26]">
                    ₹{(Number(item.amount) || Number(item.qty) * Number(item.rate)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-[#e0e2e6] bg-[#fafbfc] text-xs">
              <tr>
                <td colSpan={5} className="p-2.5 text-right font-bold text-[#5f6570]">
                  Taxable Subtotal:
                </td>
                <td className="p-2.5 text-right font-bold text-[#181d26]">
                  ₹{subtotal.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="p-2.5 text-right text-[11px] text-[#5f6570]">
                  Applicable GST ({gstRate}% blended EPC rate):
                </td>
                <td className="p-2.5 text-right font-medium text-[#181d26]">
                  ₹{gstAmount.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="border-t border-[#e0e2e6] bg-[#f0f2f5] text-sm">
                <td colSpan={5} className="p-3 text-right font-extrabold text-[#181d26]">
                  Total Turnkey Contract Value:
                </td>
                <td className="p-3 text-right font-extrabold text-[#aa2d00]">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Standard Terms */}
          <div className="rounded-lg bg-[#fafbfc] p-4 border border-[#e0e2e6] space-y-2 text-[10px] text-[#5f6570]">
            <p className="font-bold text-[#181d26] uppercase">Terms & Conditions:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Payment Schedule: 10% Advance Token, 60% Pre-Dispatch, 20% Structure Mounting, 10% Net Metering.</li>
              <li>Warranty: 25-Year Performance Warranty on Solar PV Modules; 5-Year Standard Inverter Warranty.</li>
              <li>Liaisoning: Sunfraa handles complete DISCOM Net Metering and CEIG statutory inspection filings.</li>
            </ol>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-[#e0e2e6]">
            <div>
              <p className="text-[10px] text-[#5f6570]">For Customer Acceptance:</p>
              <div className="mt-8 border-t border-dashed border-[#d0d4dc] pt-2">
                <p className="text-[11px] font-semibold text-[#181d26]">Authorized Signatory</p>
                <p className="text-[10px] text-[#9297a0]">{project.client_name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#5f6570]">For Sunfraa Global:</p>
              <div className="mt-8 border-t border-dashed border-[#d0d4dc] pt-2">
                <p className="text-[11px] font-semibold text-[#181d26]">Eshan Choliya, Director</p>
                <p className="text-[10px] text-[#9297a0]">Sunfraa Global Clean Energy EPC</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
