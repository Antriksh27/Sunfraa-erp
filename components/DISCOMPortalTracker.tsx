'use client';

import { useState } from 'react';
import { DISCOMPortalRecord, DISCOMPortalName, DISCOMAppStatus } from '@/types/database';
import { saveDISCOMPortalRecordAction } from '@/app/design/../liaisoning/actions';
import { Globe, Plus, AlertCircle, CheckCircle2, Clock, X, Loader2, ExternalLink, ShieldAlert } from 'lucide-react';

interface DISCOMPortalTrackerProps {
  projectId: string;
  records: DISCOMPortalRecord[];
  canEdit: boolean;
}

const PORTALS: { id: DISCOMPortalName; name: string }[] = [
  { id: 'TORRENT_POWER', name: 'Torrent Power Portal' },
  { id: 'UGVCL', name: 'UGVCL (Uttar Gujarat Vij)' },
  { id: 'PGVCL', name: 'PGVCL (Paschim Gujarat Vij)' },
  { id: 'MGVCL', name: 'MGVCL (Madhya Gujarat Vij)' },
  { id: 'DGVCL', name: 'DGVCL (Dakshin Gujarat Vij)' },
  { id: 'OTHER', name: 'Other DISCOM Portal' },
];

export default function DISCOMPortalTracker({
  projectId,
  records,
  canEdit,
}: DISCOMPortalTrackerProps) {
  const [showModal, setShowModal] = useState(false);
  const [portalName, setPortalName] = useState<DISCOMPortalName>('TORRENT_POWER');
  const [portalOtherName, setPortalOtherName] = useState('');
  const [applicationNumber, setApplicationNumber] = useState('');
  const [ackReceiptUrl, setAckReceiptUrl] = useState('');
  const [status, setStatus] = useState<DISCOMAppStatus>('APPLIED');
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const now = new Date().toISOString();
    const res = await saveDISCOMPortalRecordAction(projectId, {
      portalName,
      portalOtherName: portalName === 'OTHER' ? portalOtherName : undefined,
      applicationNumber,
      ackReceiptUrl: ackReceiptUrl || undefined,
      status,
      queryText: status === 'QUERY_RAISED' ? queryText : undefined,
      queryRaisedAt: status === 'QUERY_RAISED' ? now : undefined,
      approvedAt: status === 'APPROVED' ? now : undefined,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setApplicationNumber('');
      setPortalOtherName('');
      setAckReceiptUrl('');
      setQueryText('');
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#aa2d00]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            DISCOM Online Portal Tracker & SLA Monitor ({records.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Log Portal Submission
          </button>
        )}
      </div>

      {/* Query SLA Alert Banner if any record has QUERY_RAISED */}
      {records.some((r) => r.status === 'QUERY_RAISED') && (
        <div className="rounded-lg border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00] flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <div>
            <p className="font-bold text-[#882400]">
              DISCOM Portal Query Pending Resolution (7-Day Statutory SLA)
            </p>
            <p className="text-[11px] text-[#aa2d00] mt-0.5">
              Queries must be answered with revised documentation within 7 calendar days to prevent automatic DISCOM application cancellation.
            </p>
          </div>
        </div>
      )}

      {records.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#9297a0]">
          No DISCOM online portal submissions logged yet.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const daysSinceQuery = r.query_raised_at
              ? Math.floor((Date.now() - new Date(r.query_raised_at).getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            const daysRemaining = Math.max(0, 7 - daysSinceQuery);

            return (
              <div key={r.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#181d26]">
                      {r.portal_name === 'OTHER' && r.portal_other_name
                        ? r.portal_other_name
                        : r.portal_name.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-[11px] text-[#5f6570]">#{r.application_number}</span>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      r.status === 'APPROVED'
                        ? 'bg-[#e8f5e9] text-[#0a2e0e]'
                        : r.status === 'QUERY_RAISED'
                        ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                        : r.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-[#fff0eb] text-[#882400]'
                    }`}
                  >
                    {r.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {r.status === 'QUERY_RAISED' && (
                  <div className="rounded bg-white p-2.5 border border-[#fcab79] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#882400]">DISCOM Query Notice:</span>
                      <span className="rounded bg-[#fff0eb] px-1.5 py-0.2 text-[10px] font-bold text-[#aa2d00]">
                        SLA: {daysRemaining} days remaining
                      </span>
                    </div>
                    <p className="text-[11px] text-[#aa2d00] italic">&quot;{r.query_text || 'Correction requested'}&quot;</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#5f6570] pt-1 border-t border-[#f0f2f5]">
                  <span>Applied: {new Date(r.applied_at).toLocaleDateString()}</span>
                  {r.ack_receipt_url && (
                    <a
                      href={r.ack_receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-semibold text-[#aa2d00] hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Ack Receipt
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Portal Submission Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Log DISCOM Portal Submission</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">DISCOM Portal *</label>
                <select
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value as DISCOMPortalName)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                >
                  {PORTALS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {portalName === 'OTHER' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Specify DISCOM Portal Name *</label>
                  <input
                    type="text"
                    required
                    value={portalOtherName}
                    onChange={(e) => setPortalOtherName(e.target.value)}
                    placeholder="e.g. Surat Electricity Co / Other Utility"
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Application / Consumer Number *</label>
                <input
                  type="text"
                  required
                  value={applicationNumber}
                  onChange={(e) => setApplicationNumber(e.target.value)}
                  placeholder="e.g. TP-SR-2026-98124"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Acknowledgement Receipt URL</label>
                <input
                  type="url"
                  value={ackReceiptUrl}
                  onChange={(e) => setAckReceiptUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Application Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as DISCOMAppStatus)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                >
                  <option value="APPLIED">Applied / Acknowledged</option>
                  <option value="QUERY_RAISED">Query Raised by DISCOM</option>
                  <option value="APPROVED">Feasibility / Sanction Approved</option>
                  <option value="REJECTED">Application Rejected</option>
                </select>
              </div>

              {status === 'QUERY_RAISED' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#aa2d00]">DISCOM Query / Clarification Text *</label>
                  <textarea
                    rows={2}
                    required
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="e.g. Sanctioned load mismatch. Customer contract demand is 10 kW, proposed plant is 15 kW."
                    className="mt-1 block w-full rounded border border-[#fcab79] p-2 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setShowModal(false)} className="rounded px-3 py-1.5 text-[#5f6570]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !applicationNumber}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
