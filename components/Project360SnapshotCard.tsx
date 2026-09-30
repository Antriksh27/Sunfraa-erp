'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Project,
  BOM,
  BOMItem,
  SiteSurvey,
  DesignFile,
  PaymentMilestone,
  ApprovalAuditLog,
  DirectorRejectionReason,
} from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';
import {
  approveProjectWithMarginAction,
  rejectProjectAction,
} from '@/app/director/approvals/actions';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  AlertTriangle,
  Compass,
  FileText,
  CreditCard,
  History,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Zap,
  Phone,
  MapPin,
  X,
} from 'lucide-react';

import { calculateProjectMargin } from '@/lib/marginCalculation';

interface Project360SnapshotCardProps {
  project: Project & {
    lead_owner?: { name: string } | null;
    boms?: (BOM & { items?: BOMItem[] })[];
    site_surveys?: SiteSurvey[];
    design_files?: DesignFile[];
    payment_milestones?: PaymentMilestone[];
    audit_logs?: (ApprovalAuditLog & { actor?: { name: string } | null })[];
  };
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export default function Project360SnapshotCard({
  project,
  isSelected = false,
  onToggleSelect,
}: Project360SnapshotCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<DirectorRejectionReason>('LOW_MARGIN');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Financial Calculations via unified marginCalculation engine
  const kw = Number(project.kw_required) || 0;
  const {
    revenue: quoteAmount,
    estimatedBomCost,
    estimatedLabourCost,
    totalCost,
    grossProfit: estimatedGrossProfit,
    marginPercentage,
    isLowMargin,
    isHealthyMargin,
  } = calculateProjectMargin(project);

  // Survey & Design References
  const survey = project.site_surveys?.[0];
  const design = project.design_files?.[0];

  // Milestone Calculations
  const milestones = project.payment_milestones || [];
  const collectedMilestones = milestones.filter((m) => m.status === 'COLLECTED');
  const totalCollected = collectedMilestones.reduce((sum, m) => sum + Number(m.amount), 0);
  const percentCollected = quoteAmount > 0 ? Math.round((totalCollected / quoteAmount) * 100) : (project.payment_status === 'COLLECTED' ? 100 : 0);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const res = await approveProjectWithMarginAction(project.id, marginPercentage);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccessMsg('Project authorized for site execution handoff!');
    }
    setLoading(false);
  }

  async function handleConfirmReject(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const res = await rejectProjectAction(project.id, rejectionReason, rejectionNotes);
    if (res?.error) {
      setError(res.error);
    } else {
      setShowRejectModal(false);
      setSuccessMsg('Project revision requested and returned to Sales/Accounts.');
    }
    setLoading(false);
  }

  return (
    <div className={`rounded-lg border bg-[#ffffff] shadow-2xs transition-all ${isSelected ? 'border-[#181d26] ring-1 ring-[#181d26]' : 'border-[#e0e2e6] hover:border-[#9297a0]'}`}>
      {successMsg && (
        <div className="m-4 flex items-center gap-2 rounded-md border border-[#a8d8c4] bg-[#e8f5e9] p-3 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}
      {/* Card Header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="mt-1 h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={getProjectUrlForRole(project.id, 'DIRECTOR')}
                  className="font-bold text-sm text-[#181d26] hover:underline flex items-center gap-1"
                >
                  {project.client_name}
                  <ExternalLink className="h-3 w-3 text-[#9297a0]" />
                </Link>
                <span className="rounded bg-[#181d26] px-2 py-0.5 text-[10px] font-bold text-white">
                  {project.kw_required} kW
                </span>
                {project.cei_required && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                    &gt;10 kW CEI
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5f6570] flex items-center gap-2 mt-0.5">
                <span>{project.phone}</span>
                <span>•</span>
                <span className="truncate max-w-xs">{project.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="flex items-center gap-1 rounded border border-[#fcab79] bg-[#fff0eb] px-3 py-1.5 text-xs font-semibold text-[#aa2d00] hover:bg-[#ffe5dc] disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reject / Revise
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Approve Project
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded bg-[#fff0eb] p-2.5 text-xs text-[#aa2d00] border border-[#fcab79]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 360° Metric Bar (4 Key Intelligence Pillars) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] text-xs">
          {/* Pillar 1: Financial Margin */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-[#5f6570]">Gross Margin</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-base font-bold ${isLowMargin ? 'text-[#aa2d00]' : isHealthyMargin ? 'text-[#16a34a]' : 'text-[#ea580c]'}`}>
                {marginPercentage}%
              </span>
              {isLowMargin && (
                <span className="rounded bg-[#fff0eb] px-1.5 py-0.2 text-[9px] font-bold text-[#aa2d00] border border-[#fcab79]">
                  Low Margin
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#5f6570]">
              Est. Profit: ₹{estimatedGrossProfit.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Pillar 2: Quotation & Pricing */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-[#5f6570]">Quotation Value</span>
            <p className="text-base font-bold text-[#181d26]">
              ₹{quoteAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-[#5f6570]">
              ₹{kw > 0 ? Math.round(quoteAmount / kw).toLocaleString('en-IN') : 0} / kW
            </p>
          </div>

          {/* Pillar 3: Advance Collection */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-[#5f6570]">Payment Verified</span>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-[#16a34a]">
                {percentCollected}%
              </span>
              <span className="rounded bg-[#e8f5e9] px-1.5 py-0.2 text-[9px] font-bold text-[#0a2e0e]">
                {project.payment_status}
              </span>
            </div>
            <p className="text-[10px] text-[#5f6570]">
              {collectedMilestones.length} milestone(s) cleared
            </p>
          </div>

          {/* Pillar 4: Technical & Site Readiness */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase text-[#5f6570]">Site Feasibility</span>
            <p className="text-xs font-bold text-[#181d26] truncate">
              {survey ? `${survey.no_of_panels || 0} Panels • ${survey.physical_measurement || 'Roof Measured'}` : 'Survey Completed'}
            </p>
            <p className="text-[10px] text-[#5f6570]">
              {design ? 'Design CAD Attached' : 'Ready for BOM release'}
            </p>
          </div>
        </div>

        {/* Expand / Collapse 360 Breakdown Toggle */}
        <div className="flex justify-between items-center pt-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#5f6570] hover:text-[#181d26]"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide Full 360° Technical & Financial Breakdown' : 'Show 360° Cost Breakdown & Audit History'}
          </button>

          {project.last_rejected_reason && (
            <span className="text-[10px] text-[#aa2d00] font-medium">
              Previously Rejected: {project.last_rejected_reason} ({new Date(project.last_rejected_at!).toLocaleDateString()})
            </span>
          )}
        </div>
      </div>

      {/* Expanded 360° Drawer */}
      {expanded && (
        <div className="border-t border-[#e0e2e6] bg-[#fafbfc] p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cost Breakdown */}
            <div className="rounded-md border border-[#e0e2e6] bg-white p-3 space-y-2">
              <span className="font-bold text-[#181d26] flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-[#aa2d00]" />
                Projected Cost Structure
              </span>
              <div className="space-y-1 text-[11px] text-[#5f6570]">
                <div className="flex justify-between">
                  <span>Quotation Revenue:</span>
                  <span className="font-bold text-[#181d26]">₹{quoteAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Est. BOM Materials:</span>
                  <span>₹{estimatedBomCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Est. Labour & Erection:</span>
                  <span>₹{estimatedLabourCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#f0f2f5] font-bold text-[#181d26]">
                  <span>Net Estimated Profit:</span>
                  <span className={isLowMargin ? 'text-[#aa2d00]' : 'text-[#16a34a]'}>
                    ₹{estimatedGrossProfit.toLocaleString('en-IN')} ({marginPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Technical Feasibility Details */}
            <div className="rounded-md border border-[#e0e2e6] bg-white p-3 space-y-2">
              <span className="font-bold text-[#181d26] flex items-center gap-1">
                <Compass className="h-3.5 w-3.5 text-[#181d26]" />
                Site Survey Findings
              </span>
              {survey ? (
                <div className="space-y-1 text-[11px] text-[#5f6570]">
                  <p>Roof Dimensions: <strong className="text-[#181d26]">{survey.physical_measurement || 'Surveyed'}</strong></p>
                  <p>GPS Coordinates: <strong className="text-[#181d26]">{survey.gps_location || 'Logged'}</strong></p>
                  <p>Proposed Panels: <strong className="text-[#181d26]">{survey.no_of_panels || 0} Modules</strong></p>
                  <p>Site Contact: <strong className="text-[#181d26]">{survey.contacted_person || 'Client'}</strong></p>
                </div>
              ) : (
                <p className="text-[11px] text-[#9297a0]">Survey specifications recorded in pipeline.</p>
              )}
            </div>

            {/* Approval Audit Trail */}
            <div className="rounded-md border border-[#e0e2e6] bg-white p-3 space-y-2">
              <span className="font-bold text-[#181d26] flex items-center gap-1">
                <History className="h-3.5 w-3.5 text-[#5f6570]" />
                Approval Audit Trail ({project.audit_logs?.length || 0})
              </span>
              {project.audit_logs && project.audit_logs.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {project.audit_logs.map((log) => (
                    <div key={log.id} className="text-[10px] border-b border-[#f0f2f5] pb-1">
                      <div className="flex justify-between">
                        <span className={`font-bold ${log.action === 'APPROVED' ? 'text-[#16a34a]' : 'text-[#aa2d00]'}`}>
                          {log.action}
                        </span>
                        <span className="text-[#9297a0]">{new Date(log.created_at).toLocaleDateString()}</span>
                      </div>
                      {log.reason && <p className="text-[#5f6570]">Reason: {log.reason}</p>}
                      {log.notes && <p className="italic text-[#333840]">&quot;{log.notes}&quot;</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#9297a0]">First time submission for Director authorization.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div className="flex items-center gap-2 text-[#aa2d00]">
                <ShieldAlert className="h-4 w-4" />
                <h3 className="text-sm font-bold">Reject & Request Revision</h3>
              </div>
              <button type="button" onClick={() => setShowRejectModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3 text-xs">
              <p className="text-[11px] text-[#5f6570]">
                Rejecting <strong>{project.client_name}</strong> will return the stage to <strong>QUOTATION_SENT</strong> so Sales and Accounts can revise the pricing, BOM, or commercial terms.
              </p>

              <div>
                <label className="block font-semibold text-[#181d26]">Rejection Reason *</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value as DirectorRejectionReason)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                >
                  <option value="LOW_MARGIN">Low Margin (&lt;15% gross profit)</option>
                  <option value="HIGH_RISK">High Risk (Site structure / credit risk)</option>
                  <option value="INCOMPLETE_DATA">Incomplete Data (Missing site survey / BOM spec)</option>
                  <option value="CAPACITY_OVERLOAD">Capacity Overload (Execution crew bottleneck)</option>
                  <option value="OTHER">Other / Custom commercial review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#181d26]">Director Feedback / Instructions *</label>
                <textarea
                  rows={3}
                  required
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Please increase quotation by ₹15,000 to cover elevated high-rise structure cost."
                  className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded px-3 py-1.5 font-medium text-[#5f6570]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !rejectionNotes.trim()}
                  className="rounded bg-[#aa2d00] px-4 py-1.5 font-semibold text-white hover:bg-[#882400] disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
