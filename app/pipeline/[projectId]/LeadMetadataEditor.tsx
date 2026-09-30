'use client';

import { useState } from 'react';
import { updateLeadMetadataAction, scheduleSurveyAction, markLeadLostAction } from '@/app/pipeline/actions';
import {
  Edit2,
  Save,
  X,
  Phone,
  MapPin,
  Zap,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Flame,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { Project, ProjectCategory, LeadSource, LeadTemperature, LeadLostReason } from '@/types/database';

interface LeadMetadataEditorProps {
  project: Project & {
    survey_assigned_engineer?: { name: string; phone?: string | null } | null;
  };
  canEdit: boolean;
  canScheduleSurvey: boolean;
  availableEngineers?: { id: string; name: string }[];
}

const TEMP_CONFIG: Record<LeadTemperature, { label: string; badgeClass: string; icon: string }> = {
  HOT: { label: 'Hot', badgeClass: 'bg-red-50 text-red-700 border-red-200', icon: '🔥' },
  WARM: { label: 'Warm', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚡' },
  COLD: { label: 'Cold', badgeClass: 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]', icon: '❄️' },
};

export default function LeadMetadataEditor({
  project,
  canEdit,
  canScheduleSurvey,
  availableEngineers = [],
}: LeadMetadataEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isMarkingLost, setIsMarkingLost] = useState(false);
  const [isSchedulingSurvey, setIsSchedulingSurvey] = useState(false);
  const [surveyDate, setSurveyDate] = useState(
    project.survey_scheduled_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [selectedEngineerId, setSelectedEngineerId] = useState(
    project.survey_assigned_engineer_id || availableEngineers[0]?.id || ''
  );
  const [lostReason, setLostReason] = useState<LeadLostReason>('PRICE');
  const [competitorName, setCompetitorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateLeadMetadataAction(project.id, formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsEditing(false);
    }
    setLoading(false);
  }

  async function handleConfirmScheduleSurvey(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await scheduleSurveyAction(
      project.id,
      surveyDate,
      selectedEngineerId || undefined
    );

    if (res?.error) {
      setError(res.error);
    } else {
      setIsSchedulingSurvey(false);
    }
    setLoading(false);
  }

  async function handleConfirmMarkLost(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await markLeadLostAction(project.id, lostReason, competitorName);
    if (res?.error) {
      setError(res.error);
    } else {
      setIsMarkingLost(false);
    }
    setLoading(false);
  }

  const temp = project.temperature ? TEMP_CONFIG[project.temperature] : TEMP_CONFIG.WARM;

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
            Project & Client Details
          </h3>
          {project.temperature && (
            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border ${temp.badgeClass}`}>
              <span>{temp.icon}</span>
              <span>{temp.label}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canScheduleSurvey && (project.stage === 'LEAD' || project.stage === 'SITE_SURVEY_SCHEDULED') && (
            <button
              onClick={() => setIsSchedulingSurvey(true)}
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#aa2d00] px-2.5 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#882400] disabled:opacity-50 transition-colors"
            >
              <Calendar className="h-3 w-3" />
              {project.stage === 'SITE_SURVEY_SCHEDULED' ? 'Reschedule / Reassign' : 'Schedule Survey'}
            </button>
          )}

          {canEdit && !project.lost_reason && project.stage !== 'CLOSED' && (
            <button
              type="button"
              onClick={() => setIsMarkingLost(true)}
              className="flex items-center gap-1 rounded border border-[#fca5a5] bg-[#fff1f2] px-2.5 py-1 text-xs font-semibold text-[#be123c] hover:bg-[#ffe4e6] transition-colors"
            >
              <UserX className="h-3 w-3" />
              Mark Lost
            </button>
          )}

          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 rounded border border-[#e0e2e6] px-2.5 py-1 text-xs font-medium text-[#41454d] hover:bg-[#f8fafc] hover:text-[#181d26] transition-colors"
            >
              <Edit2 className="h-3 w-3" />
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Lost Banner if closed/lost */}
      {project.lost_reason && (
        <div className="rounded-lg border border-[#fca5a5] bg-[#fff1f2] p-3 text-xs text-[#be123c]">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Project Marked as Lost</span>
          </div>
          <p className="mt-1 text-[11px]">
            Reason: <span className="font-semibold">{project.lost_reason.replace(/_/g, ' ')}</span>
            {project.lost_competitor_name && ` (Competitor: ${project.lost_competitor_name})`}
            {project.lost_at && ` on ${new Date(project.lost_at).toLocaleDateString()}`}
          </p>
        </div>
      )}

      {/* Mark Lost Modal / Confirmation Drawer */}
      {isMarkingLost && (
        <form onSubmit={handleConfirmMarkLost} className="rounded-lg border border-[#fca5a5] bg-[#fff1f2]/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#be123c] flex items-center gap-1.5">
              <UserX className="h-4 w-4" />
              Mark Opportunity as Lost
            </h4>
            <button type="button" onClick={() => setIsMarkingLost(false)} className="text-[#9297a0] hover:text-[#181d26]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#181d26]">
                Lost Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value as LeadLostReason)}
                className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              >
                <option value="PRICE">Price / Budget Too High</option>
                <option value="COMPETITOR">Lost to Competitor</option>
                <option value="PROJECT_SHELVED">Project Shelved / Delayed by Client</option>
                <option value="FINANCING_FELL_THROUGH">Financing / Bank Loan Rejected</option>
                <option value="OTHER">Other Reason</option>
              </select>
            </div>

            {lostReason === 'COMPETITOR' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">
                  Competitor Name (Optional)
                </label>
                <input
                  type="text"
                  value={competitorName}
                  onChange={(e) => setCompetitorName(e.target.value)}
                  placeholder="e.g. Tata Power Solar, Local Vendor"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMarkingLost(false)}
              className="rounded px-3 py-1 text-xs font-medium text-[#41454d] hover:text-[#181d26]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1 rounded bg-[#be123c] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#9f1239] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserX className="h-3 w-3" />}
              Confirm Lost
            </button>
          </div>
        </form>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <span>{error}</span>
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Client Name</label>
              <input
                name="clientName"
                type="text"
                required
                defaultValue={project.client_name}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Phone</label>
              <input
                name="phone"
                type="tel"
                required
                defaultValue={project.phone}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#181d26]">Site Address</label>
              <textarea
                name="address"
                rows={2}
                required
                defaultValue={project.address}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Lead Source</label>
              <select
                name="leadSource"
                defaultValue={project.lead_source || 'REFERRAL'}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              >
                <option value="REFERRAL">Referral</option>
                <option value="PAID_ADS">Paid Ads</option>
                <option value="CAMPAIGN">Campaign</option>
                <option value="WALK_IN">Walk In</option>
                <option value="GOVT_TENDER">Govt Tender</option>
                <option value="COLD_OUTREACH">Cold Outreach</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Source Detail</label>
              <input
                name="sourceDetail"
                type="text"
                defaultValue={project.source_detail || ''}
                placeholder="e.g. Campaign name, Referrer"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Temperature</label>
              <select
                name="temperature"
                defaultValue={project.temperature || 'WARM'}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              >
                <option value="HOT">🔥 Hot</option>
                <option value="WARM">⚡ Warm</option>
                <option value="COLD">❄️ Cold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Expected Close Date</label>
              <input
                name="expectedCloseDate"
                type="date"
                defaultValue={project.expected_close_date || ''}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Category</label>
              <select
                name="category"
                defaultValue={project.category}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              >
                <option value="RESIDENTIAL_BUNGALOW">Residential Bungalow</option>
                <option value="RESIDENTIAL_FLAT">Residential Flat</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">kW Required</label>
              <input
                name="kwRequired"
                type="number"
                step="0.1"
                required
                defaultValue={project.kw_required}
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Sanctioned Load</label>
              <input
                name="sanctionedLoad"
                type="text"
                defaultValue={project.sanctioned_load || ''}
                placeholder="e.g. 10 kW"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#181d26]">Connection Number</label>
              <input
                name="connectionNumber"
                type="text"
                defaultValue={project.connection_number || ''}
                placeholder="e.g. 0398210398"
                className="mt-1 block w-full rounded-md border border-[#e0e2e6] px-3 py-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f0f2f5]">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded px-3 py-1.5 text-xs font-medium text-[#41454d] hover:text-[#181d26]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div>
            <span className="text-[11px] font-medium text-[#5f6570]">Contact Information</span>
            <p className="mt-1 font-bold text-[#181d26]">{project.client_name}</p>
            <p className="flex items-center gap-1 text-[#41454d] mt-0.5">
              <Phone className="h-3 w-3 text-[#9297a0]" />
              {project.phone}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-[#5f6570]">Acquisition & Schedule</span>
            <p className="mt-1 font-medium text-[#181d26]">
              Source: <span className="font-semibold">{project.lead_source?.replace(/_/g, ' ') || 'Referral'}</span>
              {project.source_detail && ` (${project.source_detail})`}
            </p>
            <p className="text-[#41454d] mt-0.5">
              Expected Close: <span className="font-semibold">{project.expected_close_date ? new Date(project.expected_close_date).toLocaleDateString() : 'Not Set'}</span>
            </p>
            {project.survey_scheduled_date && (
              <p className="text-[#882400] mt-1 font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Survey: {new Date(project.survey_scheduled_date).toLocaleDateString()}
                {project.survey_assigned_engineer?.name && (
                  <span className="text-[#41454d] font-normal">
                    ({project.survey_assigned_engineer.name})
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <span className="text-[11px] font-medium text-[#5f6570]">Capacity & Utility</span>
            <p className="mt-1 font-bold text-[#181d26]">{project.kw_required} kW ({project.category.replace(/_/g, ' ')})</p>
            <p className="text-[#41454d] mt-0.5">
              Sanctioned Load: {project.sanctioned_load || 'Not Set'} | Consumer #: {project.connection_number || 'Not Set'}
            </p>
          </div>

          <div className="sm:col-span-3 border-t border-[#f0f2f5] pt-2">
            <span className="text-[11px] font-medium text-[#5f6570]">Site Address</span>
            <p className="mt-0.5 flex items-start gap-1 text-[#333840]">
              <MapPin className="h-3.5 w-3.5 text-[#9297a0] shrink-0 mt-0.5" />
              {project.address}
            </p>
          </div>
        </div>
      )}

      {/* Schedule Survey Modal */}
      {isSchedulingSurvey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
          <div className="w-full max-w-md rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#aa2d00]" />
                <h3 className="text-sm font-bold text-[#181d26]">
                  {project.stage === 'SITE_SURVEY_SCHEDULED' ? 'Reschedule Site Survey' : 'Schedule Site Survey'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSchedulingSurvey(false)}
                className="text-[#9297a0] hover:text-[#41454d]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#5f6570] leading-relaxed">
              Coordinate technical on-site roof inspection for <strong>{project.client_name}</strong>. Assign the target appointment date and which Site Execution engineer will conduct the assessment.
            </p>

            <form onSubmit={handleConfirmScheduleSurvey} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-[#333840]">Appointment Date *</label>
                <input
                  type="date"
                  required
                  value={surveyDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSurveyDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-xs text-[#181d26] focus:border-[#aa2d00] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333840]">Assign Execution Engineer *</label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-[#d0d4dc] px-3 py-2 text-xs text-[#181d26] focus:border-[#aa2d00] focus:outline-none"
                >
                  <option value="">Select an Execution Engineer...</option>
                  {availableEngineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name}
                    </option>
                  ))}
                </select>
                {availableEngineers.length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    No dedicated Site Execution accounts found. Will default to team queue.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f2f5]">
                <button
                  type="button"
                  onClick={() => setIsSchedulingSurvey(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#41454d] hover:bg-[#f0f2f5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#aa2d00] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#882400] disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  Confirm Survey Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
