'use client';

import { useState } from 'react';
import Link from 'next/link';
import { batchApproveProjectsAction } from '@/app/director/approvals/actions';
import {
  CheckSquare,
  CheckCircle2,
  Zap,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  History,
  Layers,
  X,
} from 'lucide-react';
import {
  Project,
  BOM,
  BOMItem,
  SiteSurvey,
  DesignFile,
  PaymentMilestone,
  ApprovalAuditLog,
} from '@/types/database';
import Project360SnapshotCard from '@/components/Project360SnapshotCard';

type ExtendedProject = Project & {
  lead_owner?: { name: string } | null;
  boms?: (BOM & { items?: BOMItem[] })[];
  site_surveys?: SiteSurvey[];
  design_files?: DesignFile[];
  payment_milestones?: PaymentMilestone[];
  audit_logs?: (ApprovalAuditLog & { actor?: { name: string } | null })[];
};

interface DirectorApprovalsViewProps {
  pendingProjects: ExtendedProject[];
  approvedProjects: ExtendedProject[];
  recentAuditLogs?: (ApprovalAuditLog & { project?: { client_name: string } | null; actor?: { name: string } | null })[];
}

export default function DirectorApprovalsView({
  pendingProjects,
  approvedProjects,
  recentAuditLogs = [],
}: DirectorApprovalsViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'audit'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Toggle selection
  function handleToggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleSelectAll() {
    if (selectedIds.size === pendingProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingProjects.map((p) => p.id)));
    }
  }

  // Calculate Batch Summary
  const selectedProjects = pendingProjects.filter((p) => selectedIds.has(p.id));
  const batchTotalKw = selectedProjects.reduce((sum, p) => sum + Number(p.kw_required || 0), 0);
  const batchTotalRevenue = selectedProjects.reduce((sum, p) => sum + Number(p.quotation_amount || 0), 0);

  async function handleConfirmBatchApprove() {
    setBatchLoading(true);
    setError(null);
    setSuccessMsg(null);
    const count = selectedIds.size;
    const res = await batchApproveProjectsAction(Array.from(selectedIds));
    if (res?.error) {
      setError(res.error);
    } else {
      setSelectedIds(new Set());
      setShowBatchModal(false);
      setSuccessMsg(`Successfully batch authorized ${count} projects for site execution handoff!`);
    }
    setBatchLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Batch Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-3 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-[#e0e2e6] bg-[#f8fafc] p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1 font-medium transition-all ${
                activeTab === 'pending'
                  ? 'bg-[#ffffff] text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5 text-[#aa2d00]" />
              Awaiting Approval ({pendingProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1 font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-[#ffffff] text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
              Approved ({approvedProjects.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 rounded-sm px-3 py-1 font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#ffffff] text-[#181d26] font-semibold shadow-2xs'
                  : 'text-[#41454d] hover:text-[#181d26]'
              }`}
            >
              <History className="h-3.5 w-3.5 text-[#5f6570]" />
              Audit Log ({recentAuditLogs.length})
            </button>
          </div>
        </div>

        {activeTab === 'pending' && pendingProjects.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-semibold text-[#5f6570] hover:text-[#181d26] px-2"
            >
              {selectedIds.size === pendingProjects.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-1.5 rounded bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-40"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Batch Approve ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-md border border-[#a8d8c4] bg-[#e8f5e9] p-3 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab 1: Pending Projects 360° Cards */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingProjects.length === 0 ? (
            <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-12 text-center text-xs text-[#9297a0] shadow-2xs">
              <CheckCircle2 className="mx-auto h-8 w-8 text-[#16a34a] mb-2" />
              <p className="font-bold text-sm text-[#181d26]">All Caught Up!</p>
              <p className="mt-1 text-[11px] text-[#5f6570]">No projects currently awaiting Director authorization.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingProjects.map((project) => (
                <Project360SnapshotCard
                  key={project.id}
                  project={project}
                  isSelected={selectedIds.has(project.id)}
                  onToggleSelect={() => handleToggleSelect(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Approved Projects */}
      {activeTab === 'history' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc]">
            <h3 className="text-xs font-bold text-[#181d26]">Recently Authorized Projects for Site Execution</h3>
          </div>
          <div className="divide-y divide-[#f0f2f5]">
            {approvedProjects.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#5f6570]">
                <History className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                <p className="font-semibold text-[#181d26]">No Approved Projects in History</p>
                <p className="text-[11px] text-[#5f6570] mt-1">Authorized projects will appear here once approved for site mobilization.</p>
              </div>
            ) : (
              approvedProjects.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#fafbfc] text-xs">
                  <div>
                    <Link href={`/pipeline/${p.id}`} className="font-bold text-sm text-[#181d26] hover:underline">
                      {p.client_name}
                    </Link>
                    <p className="text-[11px] text-[#5f6570] mt-0.5">
                      {p.kw_required} kW • ₹{Number(p.quotation_amount).toLocaleString('en-IN')} • Approved on {p.director_approved_at ? new Date(p.director_approved_at).toLocaleDateString() : 'Yes'}
                    </p>
                  </div>
                  <Link
                    href={`/execution/${p.id}`}
                    className="rounded border border-[#e0e2e6] bg-white px-3 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc]"
                  >
                    View Execution Order
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Complete Audit Trail */}
      {activeTab === 'audit' && (
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-[#f0f2f5] bg-[#fafbfc]">
            <h3 className="text-xs font-bold text-[#181d26]">Director Governance & Approval Audit Trail</h3>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570] border-b border-[#e0e2e6]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Project</th>
                <th className="p-3">Action</th>
                <th className="p-3">Margin %</th>
                <th className="p-3">Reason / Notes</th>
                <th className="p-3">Director</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f2f5]">
              {recentAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-[#5f6570]">
                    <ShieldCheck className="mx-auto h-8 w-8 text-[#d0d4dc] mb-2" />
                    <p className="font-semibold text-[#181d26]">No Audit Trail Entries</p>
                    <p className="text-[11px] text-[#5f6570] mt-1">All director approvals, rejections, and margin reviews are permanently logged here.</p>
                  </td>
                </tr>
              ) : (
                recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fafbfc]">
                    <td className="p-3 text-[#5f6570]">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-[#181d26]">{log.project?.client_name || 'Project'}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${log.action === 'APPROVED' ? 'bg-[#e8f5e9] text-[#0a2e0e]' : 'bg-[#fff0eb] text-[#aa2d00]'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-[#181d26]">
                      {log.estimated_margin ? `${log.estimated_margin}%` : '—'}
                    </td>
                    <td className="p-3 text-[#5f6570]">
                      {log.reason && <span className="font-medium text-[#aa2d00] mr-1">[{log.reason}]</span>}
                      {log.notes || '—'}
                    </td>
                    <td className="p-3 text-[#181d26] font-medium">{log.actor?.name || 'Director'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Batch Approval Confirmation Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#16a34a]" />
                <h3 className="text-sm font-bold text-[#181d26]">Confirm Batch Director Authorization</h3>
              </div>
              <button type="button" onClick={() => setShowBatchModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-lg bg-[#fafbfc] p-4 border border-[#f0f2f5] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5f6570]">Total Projects Selected:</span>
                <span className="font-bold text-[#181d26]">{selectedIds.size} Sites</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5f6570]">Total Solar Capacity:</span>
                <span className="font-bold text-[#181d26]">{batchTotalKw} kW</span>
              </div>
              <div className="flex justify-between border-t border-[#e0e2e6] pt-1 text-sm font-bold text-[#181d26]">
                <span>Total Contract Revenue:</span>
                <span className="text-[#16a34a]">₹{batchTotalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#5f6570]">
              Approving these projects will immediately release them into Module 3 (Site Execution) and Module 4 (Store & BOM Allocation).
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="rounded px-3 py-1.5 text-xs font-medium text-[#5f6570]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBatchApprove}
                disabled={batchLoading}
                className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
              >
                {batchLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                Authorize All {selectedIds.size} Projects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
