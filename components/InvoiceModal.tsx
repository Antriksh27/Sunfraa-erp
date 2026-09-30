'use client';

import { useRef } from 'react';
import { Project, Invoice } from '@/types/database';
import { Printer, X, Download, Zap, Building2 } from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice;
  project: Project;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, project, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const gstRate = Number(invoice.gst_rate) || 13.8;
  const halfGst = (gstRate / 2).toFixed(1);
  const halfGstAmount = (Number(invoice.gst_amount) / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="print:hidden flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#181d26]">{invoice.invoice_number}</span>
            <span className="rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              {invoice.invoice_type} INVOICE
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

        {/* Printable Invoice Document */}
        <div ref={printRef} className="p-8 overflow-y-auto font-sans text-xs space-y-6 text-[#181d26]">
          {/* Company Header */}
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
                Clean Energy EPC & Rooftop Solar Engineering Solutions
              </p>
              <p className="text-[10px] text-[#5f6570]">
                GSTIN: <strong>24AAACS1234F1Z5</strong> • CIN: U40106GJ2022PTC123456
              </p>
              <p className="text-[10px] text-[#5f6570]">
                Plot 42, GIDC Solar Park, Ahmedabad, Gujarat — 380015
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-[#5f6570]">
                TAX INVOICE
              </span>
              <p className="text-sm font-extrabold text-[#181d26] mt-0.5">{invoice.invoice_number}</p>
              <p className="text-[11px] text-[#5f6570] mt-1">
                Date: {new Date(invoice.issued_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
              </p>
            </div>
          </div>

          {/* Client & Billing Info */}
          <div className="grid grid-cols-2 gap-6 bg-[#fafbfc] p-4 rounded border border-[#f0f2f5]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">
                Billed To (Customer):
              </span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">{project.client_name}</p>
              <p className="text-[11px] text-[#41454d] mt-0.5">{project.address}</p>
              <p className="text-[11px] text-[#41454d]">Phone: {project.phone}</p>
              <p className="text-[10px] text-[#5f6570] mt-1">
                Consumer / Connection #: {project.connection_number || 'N/A'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6570]">
                Project Scope & Spec:
              </span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">
                {project.kw_required} kW On-Grid Rooftop Solar System
              </p>
              <p className="text-[11px] text-[#41454d] mt-0.5">
                Category: {project.category.replace(/_/g, ' ')}
              </p>
              <p className="text-[10px] text-[#5f6570] mt-1">
                Sanctioned Load: {project.sanctioned_load || 'N/A'}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left border border-[#e0e2e6]">
            <thead className="bg-[#f0f2f5] text-[10px] font-bold uppercase text-[#5f6570]">
              <tr>
                <th className="p-2.5 border-b border-[#e0e2e6]">Description of Services / Goods</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-center w-20">HSN/SAC</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-24">Taxable (₹)</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-24">GST ({gstRate}%)</th>
                <th className="p-2.5 border-b border-[#e0e2e6] text-right w-28">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5] text-xs">
              <tr>
                <td className="p-2.5">
                  <p className="font-bold text-[#181d26]">
                    Solar EPC Installation & Commissioning Milestone
                  </p>
                  <p className="text-[10px] text-[#5f6570]">
                    Supply and erection of solar PV modules, grid tie inverters, structure, BOS, and DISCOM net-metering.
                  </p>
                </td>
                <td className="p-2.5 text-center text-[#5f6570]">8466 / 9954</td>
                <td className="p-2.5 text-right font-medium">₹{Number(invoice.amount).toLocaleString('en-IN')}</td>
                <td className="p-2.5 text-right font-medium">₹{Number(invoice.gst_amount).toLocaleString('en-IN')}</td>
                <td className="p-2.5 text-right font-bold text-[#181d26]">
                  ₹{Number(invoice.total_amount).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Tax Calculation Breakdown */}
          <div className="flex justify-end">
            <div className="w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5f6570]">
                <span>Taxable Value:</span>
                <span className="font-semibold text-[#181d26]">₹{Number(invoice.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-[#5f6570]">
                <span>CGST ({halfGst}%):</span>
                <span>₹{halfGstAmount}</span>
              </div>
              <div className="flex justify-between text-[#5f6570]">
                <span>SGST ({halfGst}%):</span>
                <span>₹{halfGstAmount}</span>
              </div>
              <div className="flex justify-between border-t border-[#181d26] pt-1.5 text-sm font-bold text-[#181d26]">
                <span>Grand Total (INR):</span>
                <span>₹{Number(invoice.total_amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Bank & Payment Details */}
          <div className="border-t border-[#e0e2e6] pt-4 grid grid-cols-2 gap-4 text-[10px] text-[#5f6570]">
            <div>
              <span className="font-bold uppercase tracking-wider text-[#181d26]">Banking Details:</span>
              <p className="mt-0.5">Bank Name: HDFC Bank Ltd</p>
              <p>Account Name: Sunfraa Solar Global Private Limited</p>
              <p>Account No: 50200012345678 • IFSC: HDFC0001234</p>
              <p>UPI ID: sunfraasolar@hdfcbank</p>
            </div>
            <div className="text-right flex flex-col justify-end">
              <p className="font-bold text-[#181d26]">For Sunfraa Solar Global Ltd</p>
              <p className="text-[10px] text-[#9297a0] mt-6">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
