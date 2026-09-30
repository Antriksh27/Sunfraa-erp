'use client';

import { useState } from 'react';
import { Profile, Project } from '@/types/database';
import { reassignProjectOwnerAction, batchReassignProjectsAction } from '@/app/manager/actions';
import { UserCheck, X, Loader2, AlertCircle } from 'lucide-react';

interface ReassignmentModalProps {
  projects: Project[];
  teamMembers: Profile[];
  onClose: () => void;
}

export default function ReassignmentModal({
  projects,
  teamMembers,
  onClose,
}: ReassignmentModalProps) {
  const [newOwnerId, setNewOwnerId] = useState<string>(teamMembers[0]?.id || '');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBatch = projects.length > 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory reassignment reason for the audit trail.');
      return;
    }

    setLoading(true);
    setError(null);

    let res;
    if (isBatch) {
      res = await batchReassignProjectsAction(
        projects.map((p) => p.id),
        newOwnerId,
        reason
      );
    } else {
      res = await reassignProjectOwnerAction(projects[0].id, newOwnerId, reason);
    }

    if (res?.error) {
      setError(res.error);
    } else {
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[#aa2d00]" />
            <h3 className="text-sm font-bold text-[#181d26]">
              {isBatch ? `Batch Reassign (${projects.length} Projects)` : 'Reassign Project Owner'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-[#9297a0] hover:text-[#181d26]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded bg-[#fff0eb] p-2.5 text-xs text-[#aa2d00] border border-[#fcab79]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <span className="text-[11px] text-[#5f6570] block">Target Project(s):</span>
            <p className="font-bold text-[#181d26] truncate">
              {isBatch
                ? `${projects.length} selected projects`
                : `${projects[0]?.client_name} (${projects[0]?.kw_required} kW)`}
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">Reassign To Officer / Engineer *</label>
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
            >
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#181d26]">
              Mandatory Reassignment Reason (Logged to Audit Trail) *
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Workload balancing: prior engineer assigned to 6 concurrent sites in Surat."
              className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs text-[#181d26]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
            <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-[#5f6570]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
