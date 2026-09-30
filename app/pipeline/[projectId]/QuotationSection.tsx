'use client';

import { useState } from 'react';
import { saveQuotationVersionAction, updateQuotationStatusAction } from '@/app/pipeline/actions';
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
} from 'lucide-react';
import { Project, Quotation, QuotationLineItem } from '@/types/database';
import QuotationPrintModal from '@/components/QuotationPrintModal';

interface QuotationSectionProps {
  project: Project;
  quotations: Quotation[];
  canEdit: boolean;
}

const DEFAULT_LINE_ITEMS: QuotationLineItem[] = [
  { item_name: 'Mono PERC Solar Panels', category: 'PANEL', qty: 10, rate: 12000, amount: 120000 },
  { item_name: 'Solar Grid-Tied Inverter', category: 'INVERTER', qty: 1, rate: 45000, amount: 45000 },
  { item_name: 'Elevated GI Structure & Hardware', category: 'STRUCTURE', qty: 1, rate: 30000, amount: 30000 },
  { item_name: 'ACDB/DCDB, Earthing & Solar Cables', category: 'BOS', qty: 1, rate: 25000, amount: 25000 },
  { item_name: 'Installation, Testing & Commissioning', category: 'LABOUR', qty: 1, rate: 20000, amount: 20000 },
];

export default function QuotationSection({
  project,
  quotations = [],
  canEdit,
}: QuotationSectionProps) {
  const [isBuildingNew, setIsBuildingNew] = useState(false);
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>(DEFAULT_LINE_ITEMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(quotations[0]?.version || null);
  const [selectedQuoteForPrint, setSelectedQuoteForPrint] = useState<Quotation | null>(null);

  const isQuoteSent = Boolean(project.quotation_sent_at) || quotations.some((q) => q.status === 'SENT' || q.status === 'APPROVED');
  const latestDispatchedQuote = quotations.find((q) => q.status === 'SENT' || q.status === 'APPROVED') || quotations[0];

  const computedTotal = lineItems.reduce(
    (acc, item) => acc + (Number(item.qty) * Number(item.rate) || 0),
    0
  );

  const handleUpdateItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'qty' || field === 'rate') {
        item.amount = Number(item.qty || 0) * Number(item.rate || 0);
      }
      updated[index] = item;
      return updated;
    });
  };

  const handleAddRow = () => {
    setLineItems((prev) => [
      ...prev,
      { item_name: 'Custom Line Item', category: 'OTHER', qty: 1, rate: 5000, amount: 5000 },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSaveQuotation(e: React.FormEvent, status: 'DRAFT' | 'SENT' = 'SENT') {
    e.preventDefault();
    if (lineItems.length === 0) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const res = await saveQuotationVersionAction(project.id, lineItems, status);

    if (res?.error) {
      setError(res.error);
    } else {
      setIsBuildingNew(false);
      setSuccessMsg(status === 'SENT' ? 'Quotation dispatched to client successfully!' : 'Quotation draft saved successfully.');
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
            Quotation & Proposal ({quotations.length} Version{quotations.length !== 1 ? 's' : ''})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {isQuoteSent ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-semibold text-[#0a2e0e] border border-[#a8d8c4]">
              <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
              Latest: ₹{Number(project.quotation_amount || latestDispatchedQuote?.total_amount || 0).toLocaleString()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-medium text-[#41454d]">
              <Clock className="h-3 w-3" />
              Not Sent
            </span>
          )}

          {canEdit && !isBuildingNew && (
            <button
              type="button"
              onClick={() => setIsBuildingNew(true)}
              className="flex items-center gap-1 rounded-md bg-[#181d26] px-2.5 py-1 text-xs font-medium text-white shadow-2xs hover:bg-[#0d1218] transition-colors"
            >
              <Plus className="h-3 w-3" />
              {quotations.length === 0 ? 'Create Quotation' : 'New Version'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-md border border-[#a8d8c4] bg-[#e8f5e9] p-3 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* New Version Builder Form */}
      {isBuildingNew && (
        <form onSubmit={handleSaveQuotation} className="rounded-lg border border-[#e0e2e6] bg-[#f8fafc] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-2">
            <h4 className="text-xs font-bold text-[#181d26]">
              Drafting Quotation Version v{quotations.length + 1}
            </h4>
            <span className="text-xs font-bold text-[#181d26]">
              Total: ₹{computedTotal.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e0e2e6] text-[10px] font-semibold text-[#5f6570] uppercase">
                  <th className="pb-1.5 font-semibold">Item Description</th>
                  <th className="pb-1.5 font-semibold w-28">Category</th>
                  <th className="pb-1.5 font-semibold w-20">Qty</th>
                  <th className="pb-1.5 font-semibold w-24">Rate (₹)</th>
                  <th className="pb-1.5 font-semibold w-24">Amount (₹)</th>
                  <th className="pb-1.5 font-semibold w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f2f5]">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/50">
                    <td className="py-1.5 pr-2">
                      <input
                        type="text"
                        required
                        value={item.item_name}
                        onChange={(e) => handleUpdateItem(idx, 'item_name', e.target.value)}
                        className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                        className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-1.5 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
                      >
                        <option value="PANEL">Panel</option>
                        <option value="INVERTER">Inverter</option>
                        <option value="STRUCTURE">Structure</option>
                        <option value="BOS">BOS / Cables</option>
                        <option value="LABOUR">Labour</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={item.qty}
                        onChange={(e) => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                        className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                        className="h-7 w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 pr-2 text-xs font-semibold text-[#181d26]">
                      ₹{(Number(item.qty) * Number(item.rate) || 0).toLocaleString()}
                    </td>
                    <td className="py-1.5">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-[#9297a0] hover:text-red-600 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#e0e2e6]">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 text-xs font-semibold text-[#aa2d00] hover:text-[#882400]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Line Item
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBuildingNew(false)}
                className="rounded px-3 py-1.5 text-xs font-medium text-[#41454d] hover:text-[#181d26]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || computedTotal <= 0}
                onClick={(e) => handleSaveQuotation(e, 'DRAFT')}
                className="flex items-center gap-1.5 rounded border border-[#181d26] bg-white px-3 py-1.5 text-xs font-semibold text-[#181d26] hover:bg-[#fafbfc] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Save as Draft
              </button>
              <button
                type="button"
                disabled={loading || computedTotal <= 0}
                onClick={(e) => handleSaveQuotation(e, 'SENT')}
                className="flex items-center gap-1.5 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Save & Dispatch v{quotations.length + 1}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty State when no quotations and not building new */}
      {!isBuildingNew && quotations.length === 0 && (
        <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-[#fafbfc] p-8 text-center text-xs text-[#5f6570]">
          <FileText className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
          <p className="font-semibold text-[#181d26]">No Quotations Created</p>
          <p className="text-[11px] text-[#5f6570] mt-1">
            {canEdit ? 'Generate your first bill of quantities and customer estimate using the "New Quotation" button above.' : 'No quotation revisions have been drafted for this project yet.'}
          </p>
        </div>
      )}

      {/* Version History List */}
      {quotations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6570] flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" />
            Quotation History
          </h4>

          {quotations.map((q) => {
            const isExpanded = expandedVersion === q.version;
            return (
              <div key={q.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] overflow-hidden">
                <div
                  onClick={() => setExpandedVersion(isExpanded ? null : q.version)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#f0f2f5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-bold text-white">
                      v{q.version}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-[#181d26]">
                        ₹{Number(q.total_amount).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#5f6570] ml-2">
                        {q.sent_at ? new Date(q.sent_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      q.status === 'APPROVED' 
                        ? 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]'
                        : q.status === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]'
                    }`}>
                      {q.status || 'SENT'}
                    </span>
                    {canEdit && q.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          setLoading(true);
                          setError(null);
                          setSuccessMsg(null);
                          const res = await updateQuotationStatusAction(q.id, project.id, 'SENT');
                          if (res?.error) {
                            setError(res.error);
                          } else {
                            setSuccessMsg(`Quotation v${q.version} successfully dispatched to client.`);
                          }
                          setLoading(false);
                        }}
                        className="inline-flex items-center gap-1 rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-[#0d1218]"
                      >
                        <Send className="h-2.5 w-2.5" />
                        Dispatch
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuoteForPrint(q);
                      }}
                      className="inline-flex items-center gap-1 rounded border border-[#d0d4dc] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#181d26] hover:bg-[#fafbfc] transition-colors shadow-2xs"
                    >
                      <Printer className="h-2.5 w-2.5 text-[#aa2d00]" />
                      Print / PDF
                    </button>
                    <span className="text-[11px] text-[#5f6570]">{q.line_items?.length || 0} items</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-[#9297a0]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#9297a0]" />}
                  </div>
                </div>

                {isExpanded && q.line_items && q.line_items.length > 0 && (
                  <div className="border-t border-[#e0e2e6] bg-white p-3">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#f0f2f5] text-[10px] font-semibold text-[#9297a0]">
                          <th className="pb-1">Item</th>
                          <th className="pb-1">Category</th>
                          <th className="pb-1 text-right">Qty</th>
                          <th className="pb-1 text-right">Rate</th>
                          <th className="pb-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f0f2f5]">
                        {q.line_items.map((item, idx) => (
                          <tr key={idx} className="text-[11px]">
                            <td className="py-1 font-medium text-[#181d26]">{item.item_name}</td>
                            <td className="py-1 text-[#5f6570]">{item.category}</td>
                            <td className="py-1 text-right text-[#5f6570]">{item.qty}</td>
                            <td className="py-1 text-right text-[#5f6570]">₹{item.rate?.toLocaleString()}</td>
                            <td className="py-1 text-right font-semibold text-[#181d26]">₹{item.amount?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Printable Quotation Modal */}
      {selectedQuoteForPrint && (
        <QuotationPrintModal
          quotation={selectedQuoteForPrint}
          project={project}
          onClose={() => setSelectedQuoteForPrint(null)}
        />
      )}
    </div>
  );
}
