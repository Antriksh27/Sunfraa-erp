'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  assignLabourAction,
  completeStageProgressAction,
  submitExecutionCompletionAction,
} from '@/app/execution/actions';
import {
  HardHat,
  Boxes,
  Users,
  CheckCircle2,
  Lock,
  Camera,
  Upload,
  Calendar,
  AlertCircle,
  Loader2,
  QrCode,
  Zap,
  Check,
  PackageCheck,
  Printer,
  ShieldCheck,
  Plus,
  ExternalLink,
} from 'lucide-react';
import {
  Project,
  BOM,
  BOMItem,
  LabourTeam,
  LabourAssignment,
  ExecutionStageProgress,
  ExecutionCompletion,
  ExecutionStage,
  CompletionCaptureMethod,
  Subcontractor,
  SiteSurvey,
} from '@/types/database';
import HandoverPacketModal from '@/components/HandoverPacketModal';

interface ExecutionWorkflowProps {
  project: Project;
  survey?: SiteSurvey | null;
  bom: (BOM & { items?: BOMItem[] }) | null;
  labourTeams: LabourTeam[];
  subcontractors?: Subcontractor[];
  labourAssignments: (LabourAssignment & {
    labour_team?: { name: string; headcount: number } | null;
    subcontractor?: Subcontractor | null;
  })[];
  stageProgress: ExecutionStageProgress[];
  completion: ExecutionCompletion | null;
  canEdit: boolean;
}

const STAGES: { key: ExecutionStage; label: string; desc: string }[] = [
  {
    key: 'STRUCTURE_FABRICATION',
    label: '1. Structure Fabrication',
    desc: 'Roof mounting rails, structure welding, foundation grouting & anchoring',
  },
  {
    key: 'PANEL',
    label: '2. Panel Mounting',
    desc: 'Solar modules clamped, string alignment, tilt angle verification',
  },
  {
    key: 'WIRING',
    label: '3. Electrical Wiring & Inverter',
    desc: 'DC cabling, ACDB/DCDB boxes, inverter installation, earthing & SPD',
  },
  {
    key: 'CIVIL',
    label: '4. Civil Finishing & Cleanup',
    desc: 'Waterproofing, cable conduit concealment, final site cleanup',
  },
];

export default function ExecutionWorkflow({
  project,
  survey = null,
  bom,
  labourTeams,
  subcontractors = [],
  labourAssignments,
  stageProgress,
  completion,
  canEdit,
}: ExecutionWorkflowProps) {
  const [materialReceived, setMaterialReceived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Labour Assignment form states
  const [labourStage, setLabourStage] = useState<ExecutionStage>('STRUCTURE_FABRICATION');
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<string>(subcontractors[0]?.id || '');
  const [headcount, setHeadcount] = useState<number>(4);
  const [labourNotes, setLabourNotes] = useState<string>('');
  const [assignedDate, setAssignedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [labourLoading, setLabourLoading] = useState(false);

  // Stage completion form states
  const [activeStageKey, setActiveStageKey] = useState<ExecutionStage | null>(null);
  const [stagePhotoUrl, setStagePhotoUrl] = useState<string>('');
  const [stageComment, setStageComment] = useState<string>('');
  const [stageUploading, setStageUploading] = useState(false);
  const [stageSubmitting, setStageSubmitting] = useState(false);

  // Completion form states
  const [completionLoading, setCompletionLoading] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const completedStageMap = new Map(stageProgress.map((p) => [p.stage, p]));
  const isAllStagesDone = STAGES.every((s) => completedStageMap.has(s.key));

  // Handle Labour Assignment
  async function handleAssignLabour(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLabourLoading(true);

    const sub = subcontractors.find((s) => s.id === selectedSubcontractorId);
    const calculatedCost = sub?.rate_type === 'PER_KW' ? (project.kw_required * sub.default_rate) : sub?.default_rate || 0;

    const result = await assignLabourAction(
      project.id,
      labourStage,
      assignedDate,
      undefined,
      selectedSubcontractorId || undefined,
      headcount,
      labourNotes,
      sub?.default_rate,
      calculatedCost
    );

    if (result?.error) {
      setError(result.error);
    } else {
      setLabourNotes('');
    }

    setLabourLoading(false);
  }

  // Handle Stage Photo Upload
  async function handleStagePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStageUploading(true);
    setError(null);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${project.id}/exec_${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('site-survey-photos')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Failed to upload stage photo: ${uploadError.message}`);
    } else if (data) {
      const { data: urlData } = supabase.storage
        .from('site-survey-photos')
        .getPublicUrl(fileName);
      setStagePhotoUrl(urlData.publicUrl);
    }
    setStageUploading(false);
  }

  // Handle Stage Submit
  async function handleCompleteStage(stage: ExecutionStage) {
    if (!stagePhotoUrl) {
      setError('Please upload or enter a verification photo URL before signing off.');
      return;
    }

    setStageSubmitting(true);
    setError(null);

    const result = await completeStageProgressAction(
      project.id,
      stage,
      [stagePhotoUrl],
      stageComment
    );

    if (result?.error) {
      setError(result.error);
    } else {
      setActiveStageKey(null);
      setStagePhotoUrl('');
      setStageComment('');
    }

    setStageSubmitting(false);
  }

  // Handle Final Completion Submit
  async function handleCompletionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setCompletionLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await submitExecutionCompletionAction(project.id, formData);

    if (result?.error) {
      setError(result.error);
      setCompletionLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#fcab79] bg-[#fff0eb] p-4 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <span>{error}</span>
        </div>
      )}

      {/* Handover Packet CTA Banner if completed */}
      {(completion || isAllStagesDone) && (
        <div className="flex items-center justify-between rounded-lg border border-[#a8d8c4] bg-[#e8f5e9] p-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#16a34a]" />
            <div>
              <h4 className="text-xs font-bold text-[#0a2e0e]">
                {completion ? 'Site Execution & Quality Sign-Off Verified' : 'All 4 Installation Stages Completed!'}
              </h4>
              <p className="text-[11px] text-[#0a2e0e]/80">
                Generate the compiled site handover dossier with all 4 verified stage photographs and barcode serials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHandoverModal(true)}
            className="flex items-center gap-1.5 rounded bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            View Handover Packet
          </button>
        </div>
      )}

      {/* Top 2 Panels: BOM Reference & Material Receipt Toggle */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* BOM Reference Panel (2 cols) */}
        <div className="lg:col-span-2 rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-[#181d26]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">Bill of Materials (BOM Spec)</h3>
            </div>
            {bom ? (
              <span className="rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-semibold text-[#0a2e0e] border border-[#a8d8c4]">
                BOM Created
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                Awaiting BOM
              </span>
            )}
          </div>

          {!bom || !bom.items || bom.items.length === 0 ? (
            <div className="py-4 text-xs text-[#5f6570]">
              <p>BOM shell has been provisioned. Store & Purchase team will populate item quantities in Module 4.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#e0e2e6] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#5f6570]">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Item Name</th>
                    <th className="px-3 py-2 font-semibold">Category</th>
                    <th className="px-3 py-2 font-semibold">Quantity</th>
                    <th className="px-3 py-2 font-semibold">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f2f5]">
                  {bom.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-2 font-medium text-[#181d26]">{item.item_name}</td>
                      <td className="px-3 py-2 text-[#5f6570]">{item.category}</td>
                      <td className="px-3 py-2 font-bold text-[#181d26]">{item.quantity}</td>
                      <td className="px-3 py-2 text-[#5f6570]">{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Material Received Confirmation Toggle */}
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[#f0f2f5] pb-3">
              <PackageCheck className="h-4 w-4 text-[#aa2d00]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">On-Site Material Check</h3>
            </div>
            <p className="mt-3 text-xs text-[#5f6570]">
              Confirm that solar modules, inverters, structural rails, and electrical cables have arrived on-site before initiating installation.
            </p>
          </div>

          <div className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={materialReceived}
                onChange={(e) => setMaterialReceived(e.target.checked)}
                className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26] focus:ring-[#181d26]"
              />
              <span className="text-xs font-bold text-[#181d26]">
                {materialReceived ? 'Material Received & Verified On-Site' : 'Confirm Materials Received On-Site'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Labour Assignment Panel */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#181d26]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">Labour & Subcontractor Allocation</h3>
          </div>
          <span className="text-[10px] text-[#5f6570]">
            Database enforces 1 active site per contractor per date
          </span>
        </div>

        {/* Existing Assignments */}
        {labourAssignments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-[#181d26]">Assigned Deployment Schedule:</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {labourAssignments.map((a) => (
                <div key={a.id} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff]/50 p-3 text-xs">
                  <div className="font-bold text-[#1e3a8a]">{a.subcontractor?.name || a.labour_team?.name || 'Labour Team'}</div>
                  <div className="text-[#41454d]">{a.stage.replace(/_/g, ' ')} ({a.headcount || 4} workers)</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-[#882400] font-semibold">
                    <Calendar className="h-3 w-3" />
                    {new Date(a.assigned_date).toLocaleDateString()}
                  </div>
                  {a.notes && <p className="text-[10px] text-[#5f6570] italic mt-1">&quot;{a.notes}&quot;</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Allocate Subcontractor Form */}
        {canEdit && (
          <form onSubmit={handleAssignLabour} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4 space-y-3">
            <h4 className="text-xs font-bold text-[#181d26]">Deploy Subcontractor / Crew</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Execution Stage *</label>
                <select
                  value={labourStage}
                  onChange={(e) => setLabourStage(e.target.value as ExecutionStage)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                >
                  {STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Subcontractor *</label>
                <select
                  value={selectedSubcontractorId}
                  onChange={(e) => setSelectedSubcontractorId(e.target.value)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                >
                  {subcontractors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.trade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Headcount</label>
                <input
                  type="number"
                  min="1"
                  value={headcount}
                  onChange={(e) => setHeadcount(parseInt(e.target.value, 10) || 1)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Deployment Date *</label>
                <input
                  type="date"
                  required
                  value={assignedDate}
                  onChange={(e) => setAssignedDate(e.target.value)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#181d26]">Deployment Notes / Work Scope</label>
                <input
                  type="text"
                  value={labourNotes}
                  onChange={(e) => setLabourNotes(e.target.value)}
                  placeholder="e.g. Structure erection + 40 panels clamping on South roof"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={labourLoading}
                  className="h-8 w-full rounded bg-[#181d26] px-4 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {labourLoading ? 'Deploying...' : 'Assign Crew'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 4 Execution Stages Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
          Installation Stages & Verification Sign-Offs (Sequential Order)
        </h3>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {STAGES.map((s, idx) => {
            const isCompleted = completedStageMap.has(s.key);
            const progress = completedStageMap.get(s.key);
            const isNextToComplete =
              !isCompleted && (idx === 0 || completedStageMap.has(STAGES[idx - 1].key));
            const isLocked = !isCompleted && !isNextToComplete;
            const isOpenForm = activeStageKey === s.key;

            return (
              <div
                key={s.key}
                className={`rounded-lg border p-5 shadow-2xs space-y-4 transition-all ${
                  isCompleted
                    ? 'border-[#a8d8c4] bg-[#ffffff]'
                    : isNextToComplete
                    ? 'border-[#181d26] bg-[#ffffff]'
                    : 'border-[#e0e2e6] bg-[#fafbfc] opacity-75'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#181d26]">{s.label}</h4>
                    <p className="text-[11px] text-[#5f6570] mt-0.5">{s.desc}</p>
                  </div>

                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-bold text-[#0a2e0e]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
                      Signed Off
                    </span>
                  ) : isLocked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-semibold text-[#5f6570]">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0eb] px-2.5 py-0.5 text-xs font-bold text-[#aa2d00] border border-[#fcab79]">
                      Ready to Sign Off
                    </span>
                  )}
                </div>

                {isCompleted && progress && (
                  <div className="space-y-3 rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] text-xs">
                    <div className="flex items-center justify-between text-[10px] text-[#5f6570]">
                      <span>Signed off: {new Date(progress.completed_at).toLocaleString()}</span>
                    </div>

                    {progress.comment && (
                      <p className="text-[11px] text-[#333840] italic bg-white p-2 rounded border border-[#f0f2f5]">
                        &quot;{progress.comment}&quot;
                      </p>
                    )}

                    {progress.photo_url && (
                      <div className="aspect-video w-full rounded overflow-hidden border border-[#e0e2e6] bg-[#f0f2f5]">
                        <img src={progress.photo_url} alt="Stage Photo" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {!isCompleted && isNextToComplete && canEdit && (
                  <div className="space-y-3 pt-2 border-t border-[#f0f2f5]">
                    {!isOpenForm ? (
                      <button
                        type="button"
                        onClick={() => setActiveStageKey(s.key)}
                        className="flex items-center gap-1.5 rounded bg-[#181d26] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Sign Off Stage
                      </button>
                    ) : (
                      <div className="rounded-lg bg-[#fafbfc] p-4 border border-[#e0e2e6] space-y-3 text-xs">
                        <div className="flex justify-between font-bold text-[#181d26]">
                          <span>Upload Verification Photo & Notes</span>
                          <button
                            type="button"
                            onClick={() => setActiveStageKey(null)}
                            className="text-[11px] text-[#5f6570] hover:text-[#181d26]"
                          >
                            Cancel
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#181d26]">
                            Installation Photo URL (or Upload) <span className="text-red-500">*</span>
                          </label>
                          <div className="mt-1 flex gap-2">
                            <input
                              type="url"
                              value={stagePhotoUrl}
                              onChange={(e) => setStagePhotoUrl(e.target.value)}
                              placeholder="https://... or choose file below"
                              className="h-8 flex-1 rounded border border-[#e0e2e6] px-2 text-xs bg-white"
                            />
                            <label className="flex h-8 cursor-pointer items-center gap-1 rounded border border-[#e0e2e6] bg-white px-3 text-[11px] font-medium text-[#181d26] hover:bg-[#f8fafc]">
                              {stageUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                              Upload
                              <input type="file" accept="image/*" onChange={handleStagePhotoUpload} className="hidden" />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-[#181d26]">Engineer Sign-Off Comments</label>
                          <textarea
                            rows={2}
                            value={stageComment}
                            onChange={(e) => setStageComment(e.target.value)}
                            placeholder="e.g. Structure rails aligned at 15 deg tilt angle, all torque tests passed."
                            className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs bg-white"
                          />
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => handleCompleteStage(s.key)}
                            disabled={stageSubmitting || !stagePhotoUrl}
                            className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                          >
                            {stageSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Submit Verified Sign-Off
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Module 3 Final Completion Panel */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[#181d26]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
              Final Handover Barcode & Serial Capture (Business Rule 9)
            </h3>
          </div>

          {completion ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-semibold text-[#0a2e0e] border border-[#a8d8c4]">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#16a34a]" />
              Execution Finalized
            </span>
          ) : isAllStagesDone ? (
            <span className="rounded-full bg-[#fff0eb] px-2.5 py-0.5 text-xs font-bold text-[#aa2d00] border border-[#fcab79]">
              Ready for Serial Capture
            </span>
          ) : (
            <span className="rounded-full bg-[#f0f2f5] px-2.5 py-0.5 text-xs font-medium text-[#5f6570]">
              Awaiting 4 Stage Sign-Offs
            </span>
          )}
        </div>

        {completion ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg bg-[#fafbfc] p-4 border border-[#f0f2f5] text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Inverter Serial Number</span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">{completion.inverter_serial_number}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Panel Count</span>
              <p className="font-bold text-sm text-[#181d26] mt-0.5">{completion.panel_count} Solar Modules</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Capture Method</span>
              <p className="font-semibold text-[#181d26] mt-0.5">{completion.captured_via}</p>
            </div>
            <div className="sm:col-span-3 border-t border-[#e0e2e6] pt-2">
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">
                Panel Barcodes ({completion.panel_serial_numbers.length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {completion.panel_serial_numbers.map((sn, idx) => (
                  <span key={idx} className="rounded bg-white border border-[#e0e2e6] px-2 py-0.5 font-mono text-[10px] text-[#181d26]">
                    {sn}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : isAllStagesDone && canEdit ? (
          <form onSubmit={handleCompletionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Panel Count *</label>
                <input
                  name="panelCount"
                  type="number"
                  min="1"
                  required
                  defaultValue={survey?.no_of_panels || 10}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-3 text-xs text-[#181d26]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Inverter Serial Number *</label>
                <input
                  name="inverterSerialNumber"
                  type="text"
                  required
                  placeholder="e.g. INV-GROWATT-987654"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-3 text-xs text-[#181d26]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Capture Method *</label>
                <select
                  name="capturedVia"
                  required
                  defaultValue="SCAN"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-3 text-xs text-[#181d26]"
                >
                  <option value="SCAN">Barcode Scanner</option>
                  <option value="PHOTO_OCR">Photo OCR Extraction</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-[#181d26]">
                  Panel Serial Numbers (One per line or comma-separated) *
                </label>
                <textarea
                  name="panelSerialNumbers"
                  rows={3}
                  required
                  placeholder="SN-PANEL-001&#10;SN-PANEL-002&#10;SN-PANEL-003"
                  className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 font-mono text-xs text-[#181d26]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[#f0f2f5] pt-4">
              <p className="text-[11px] text-[#5f6570]">
                Statutory liaisoning unlocked at Electrical Wiring sign-off ({project.cei_required ? 'CEI_IN_PROGRESS' : 'LIAISONING_IN_PROGRESS'}). Submitting records final equipment barcodes for the site handover dossier.
              </p>
              <button
                type="submit"
                disabled={completionLoading}
                className="flex items-center gap-1.5 rounded bg-[#181d26] px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
              >
                {completionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit Equipment Dossier
              </button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-[#9297a0] italic">
            Complete all 4 stages above (Structure Fabrication, Panel Mounting, Wiring, and Civil Finishing) to unlock serial number recording and project completion dossier. Note: Statutory liaisoning already unlocks upon Electrical Wiring completion.
          </p>
        )}
      </div>

      {/* Handover Dossier Modal */}
      {showHandoverModal && (
        <HandoverPacketModal
          project={project}
          survey={survey}
          stageProgress={stageProgress}
          completion={completion}
          onClose={() => setShowHandoverModal(false)}
        />
      )}
    </div>
  );
}
