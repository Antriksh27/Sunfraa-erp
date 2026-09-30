'use client';

import { useState } from 'react';
import { SubsidyClaim, SubsidyClaimStatus } from '@/types/database';
import { saveSubsidyClaimAction } from '@/app/design/../liaisoning/actions';
import { IndianRupee, Plus, X, Loader2, CheckCircle2, AlertCircle, Award } from 'lucide-react';

interface SubsidyReleaseTrackerProps {
  projectId: string;
  claims: SubsidyClaim[];
  canEdit: boolean;
}

export default function SubsidyReleaseTracker({
  projectId,
  claims,
  canEdit,
}: SubsidyReleaseTrackerProps) {
  const [showModal, setShowModal] = useState(false);
  const [consumerNumber, setConsumerNumber] = useState('');
  const [nationalPortalAppNo, setNationalPortalAppNo] = useState('');
  const [subsidyAmount, setSubsidyAmount] = useState<number>(78000);
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [inspectedAt, setInspectedAt] = useState('');
  const [disbursedAt, setDisbursedAt] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [status, setStatus] = useState<SubsidyClaimStatus>('CLAIMED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await saveSubsidyClaimAction(projectId, {
      consumerNumber: consumerNumber || undefined,
      nationalPortalAppNo,
      subsidyAmount,
      claimSubmittedAt: claimDate,
      inspectedAt: inspectedAt || undefined,
      disbursedAt: disbursedAt || undefined,
      utrNumber: utrNumber || undefined,
      status,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setNationalPortalAppNo('');
      setUtrNumber('');
    }
    setLoading(false);
  }

  const totalDisbursed = claims
    .filter((c) => c.status === 'DISBURSED')
    .reduce((sum, c) => sum + Number(c.subsidy_amount), 0);

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-600" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            PM Surya Ghar / National Portal Subsidy Tracker ({claims.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Log Subsidy Claim
          </button>
        )}
      </div>

      {claims.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#9297a0]">
          No central/state subsidy claims filed on National Portal yet.
        </p>
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div key={c.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#181d26]">App #{c.national_portal_app_no}</span>
                  {c.consumer_number && (
                    <span className="text-[11px] text-[#5f6570] ml-2">Consumer #{c.consumer_number}</span>
                  )}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    c.status === 'DISBURSED'
                      ? 'bg-[#e8f5e9] text-[#0a2e0e]'
                      : c.status === 'INSPECTED'
                      ? 'bg-[#fff0eb] text-[#882400]'
                      : c.status === 'REJECTED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-[#f0f2f5]">
                  <span className="text-[#5f6570] block">Subsidy Amount</span>
                  <strong className="text-[#181d26]">₹{Number(c.subsidy_amount).toLocaleString('en-IN')}</strong>
                </div>
                <div className="p-2 rounded bg-white border border-[#f0f2f5]">
                  <span className="text-[#5f6570] block">Claim Date</span>
                  <strong className="text-[#181d26]">{new Date(c.claim_submitted_at).toLocaleDateString()}</strong>
                </div>
                {c.utr_number && (
                  <div className="p-2 rounded bg-white border border-[#f0f2f5] col-span-2 sm:col-span-1">
                    <span className="text-[#5f6570] block">Disbursement UTR</span>
                    <strong className="text-[#181d26] font-mono text-[10px]">{c.utr_number}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Subsidy Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Log National Portal Subsidy Claim</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">National Portal Application # *</label>
                <input
                  type="text"
                  required
                  value={nationalPortalAppNo}
                  onChange={(e) => setNationalPortalAppNo(e.target.value)}
                  placeholder="e.g. MNRE-SG-2026-881290"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Consumer Electricity Account #</label>
                <input
                  type="text"
                  value={consumerNumber}
                  onChange={(e) => setConsumerNumber(e.target.value)}
                  placeholder="e.g. 100982231"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Subsidy Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={subsidyAmount}
                    onChange={(e) => setSubsidyAmount(parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Claim Date *</label>
                  <input
                    type="date"
                    required
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Subsidy Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as SubsidyClaimStatus)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                >
                  <option value="CLAIMED">Claim Submitted (Under Review)</option>
                  <option value="INSPECTED">Site Inspected by DISCOM/MNRE</option>
                  <option value="DISBURSED">Subsidy Disbursed via DBT</option>
                  <option value="REJECTED">Claim Rejected / Documentation Mismatch</option>
                </select>
              </div>

              {status === 'DISBURSED' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#16a34a]">DBT Bank UTR / Reference Number</label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. SBIN8299104812"
                    className="mt-1 h-8 block w-full rounded border border-[#a8d8c4] px-2 text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setShowModal(false)} className="rounded px-3 py-1.5 text-[#5f6570]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !nationalPortalAppNo}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
