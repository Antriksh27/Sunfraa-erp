'use client';

import { AgingBucketMetric } from '@/lib/reportsEngine';
import ExportCSVButton from '@/components/ExportCSVButton';
import { CSVColumn } from '@/lib/csvExport';
import { Clock, IndianRupee, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AgingReceivablesReportCardProps {
  agingMetrics: AgingBucketMetric[];
}

const AGING_COLUMNS: CSVColumn<{ invoiceNumber: string; clientName: string; amount: number; daysOverdue: number; bucket: string }>[] = [
  { header: 'Aging Bucket', accessor: 'bucket' },
  { header: 'Invoice Number', accessor: 'invoiceNumber' },
  { header: 'Client Name', accessor: 'clientName' },
  { header: 'Amount (₹)', accessor: 'amount' },
  { header: 'Days Outstanding', accessor: 'daysOverdue' },
];

export default function AgingReceivablesReportCard({ agingMetrics }: AgingReceivablesReportCardProps) {
  const flattenedInvoices = agingMetrics.flatMap((b) =>
    b.invoices.map((inv) => ({ ...inv, bucket: b.bucket }))
  );

  const totalOutstanding = agingMetrics.reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#16a34a] border border-[#d1fae5]">
              <Clock className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-[#181d26] uppercase tracking-wider font-mono">
              Aging Accounts Receivables & Overdue Debt Ledger
            </h3>
          </div>
          <p className="text-xs text-[#5f6570] font-medium mt-1">
            Total Outstanding Receivables: <strong className="text-[#181d26] font-bold">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <ExportCSVButton
          filename="aging_accounts_receivables"
          columns={AGING_COLUMNS}
          data={flattenedInvoices}
          label="Export Aging CSV"
        />
      </div>

      {/* 4 Aging Metric Buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agingMetrics.map((b) => {
          const isCritical = b.bucket === '> 90 Days (Overdue)';
          const isWarning = b.bucket === '60 - 90 Days';

          return (
            <div
              key={b.bucket}
              className={`rounded-lg border p-4 space-y-2 ${
                isCritical
                  ? 'border-[#fcab79] bg-[#fff0eb]/40'
                  : isWarning
                  ? 'border-amber-200 bg-amber-50/30'
                  : 'border-[#e0e2e6] bg-[#fafbfc]'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-bold text-[#181d26]">
                <span>{b.bucket}</span>
                <span className="rounded bg-white px-2 py-0.5 text-[10px] text-[#5f6570] border border-[#e0e2e6]">
                  {b.invoiceCount} Invoices
                </span>
              </div>
              <p className={`text-lg font-bold ${isCritical ? 'text-[#aa2d00]' : 'text-[#181d26]'}`}>
                ₹{b.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
          );
        })}
      </div>

      {/* Detailed Invoice Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-[#e0e2e6] rounded-lg overflow-hidden">
          <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
            <tr>
              <th className="p-2.5">Invoice #</th>
              <th className="p-2.5">Client Name</th>
              <th className="p-2.5">Aging Bracket</th>
              <th className="p-2.5 text-right">Outstanding (₹)</th>
              <th className="p-2.5 text-right">Days Elapsed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f2f5]">
            {flattenedInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#9297a0]">
                  No outstanding receivables recorded.
                </td>
              </tr>
            ) : (
              flattenedInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-[#fafbfc]">
                  <td className="p-2.5 font-bold font-mono text-[#181d26]">{inv.invoiceNumber}</td>
                  <td className="p-2.5 font-medium text-[#181d26]">{inv.clientName}</td>
                  <td className="p-2.5">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                        inv.bucket.includes('> 90')
                          ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                          : 'bg-[#f0f2f5] text-[#333840]'
                      }`}
                    >
                      {inv.bucket}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-[#181d26]">
                    ₹{inv.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right text-[#5f6570]">{inv.daysOverdue} days</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
