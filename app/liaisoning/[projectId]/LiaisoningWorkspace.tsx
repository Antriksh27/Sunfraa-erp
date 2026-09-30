'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  confirmDocumentsReceivedAction,
  updateRegistrationNumberAction,
  updateGovtEstimateAction,
  markEstimatePaidAction,
  logDiscomFollowUpAction,
  markConnectedAndUploadMeterReportAction,
  updateCEIRecordAction,
  updatePortalRouteAction,
} from '@/app/liaisoning/actions';
import {
  Building2,
  FileCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  Upload,
  AlertTriangle,
  Loader2,
  Calendar,
  Zap,
  Download,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  Award,
  Compass,
} from 'lucide-react';
import {
  Project,
  LiaisoningRecord,
  DiscomFollowUpLog,
  CEIRecord,
  DesignFile,
  DISCOMPortalRecord,
  CEIInspectorLog,
  MeterTestRecord,
  SubsidyClaim,
  PortalRoute,
  SubsidyType,
} from '@/types/database';
import DISCOMPortalTracker from '@/components/DISCOMPortalTracker';
import CEIInspectorVisitLogs from '@/components/CEIInspectorVisitLogs';
import MeterTestRecordCard from '@/components/MeterTestRecordCard';
import SubsidyReleaseTracker from '@/components/SubsidyReleaseTracker';

interface LiaisoningWorkspaceProps {
  project: Project;
  liaisoningRecord: (LiaisoningRecord & { follow_up_logs?: DiscomFollowUpLog[] }) | null;
  ceiRecord: CEIRecord | null;
  ceiDrawings: DesignFile[];
  discomRecords?: DISCOMPortalRecord[];
  inspectorLogs?: CEIInspectorLog[];
  meterRecords?: MeterTestRecord[];
  subsidyClaims?: SubsidyClaim[];
  canEdit: boolean;
}

export default function LiaisoningWorkspace({
  project,
  liaisoningRecord,
  ceiRecord,
  ceiDrawings,
  discomRecords = [],
  inspectorLogs = [],
  meterRecords = [],
  subsidyClaims = [],
  canEdit,
}: LiaisoningWorkspaceProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Loading states
  const [docLoading, setDocLoading] = useState(false);
  const [ackLoading, setAckLoading] = useState(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [meterUploading, setMeterUploading] = useState(false);
  const [meterSubmitting, setMeterSubmitting] = useState(false);
  const [meterReportUrl, setMeterReportUrl] = useState('');
  const [ceiLoading, setCeiLoading] = useState(false);

  // Portal Routing states (Business Rule: Required early selection before registration)
  const isCommercial = project.category === 'COMMERCIAL' || project.category === 'INDUSTRIAL';
  const defaultRoute: PortalRoute | '' = liaisoningRecord?.portal_route || (isCommercial ? 'GEDA_PORTAL' : '');
  const [selectedRoute, setSelectedRoute] = useState<PortalRoute | ''>(defaultRoute);
  const [selectedSubsidyType, setSelectedSubsidyType] = useState<SubsidyType>(
    liaisoningRecord?.subsidy_type || (project.category === 'RESIDENTIAL_FLAT' ? 'COMMON_SUBSIDY' : 'INDIVIDUAL_SUBSIDY')
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [isEditingRoute, setIsEditingRoute] = useState(!liaisoningRecord?.portal_route);

  async function handleSaveRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoute) {
      setError('Please select a statutory portal route.');
      return;
    }
    if (selectedRoute === 'NATIONAL_PORTAL_SUBSIDY' && !selectedSubsidyType) {
      setError('Please select a subsidy scheme type.');
      return;
    }

    setRouteLoading(true);
    setError(null);
    setSuccessMsg(null);

    const result = await updatePortalRouteAction(
      project.id,
      selectedRoute,
      selectedRoute === 'NATIONAL_PORTAL_SUBSIDY' ? selectedSubsidyType : null
    );

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg('Statutory portal route and scheme configured successfully.');
      setIsEditingRoute(false);
    }
    setRouteLoading(false);
  }

  // Handle Document Confirmation
  async function handleConfirmDocs() {
    setDocLoading(true);
    setError(null);
    setSuccessMsg(null);
    const result = await confirmDocumentsReceivedAction(project.id);
    if (result?.error) setError(result.error);
    else setSuccessMsg('Document packet confirmed and logged successfully.');
    setDocLoading(false);
  }

  // Handle Ack Number Submit
  async function handleAckSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAckLoading(true);
    setError(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateRegistrationNumberAction(project.id, formData);
    if (result?.error) setError(result.error);
    else setSuccessMsg('DISCOM acknowledgement registration number saved successfully.');
    setAckLoading(false);
  }

  // Handle Estimate Submit
  async function handleEstimateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEstimateLoading(true);
    setError(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateGovtEstimateAction(project.id, formData);
    if (result?.error) setError(result.error);
    else setSuccessMsg('Government DISCOM estimate details updated successfully.');
    setEstimateLoading(false);
  }

  // Handle Estimate Paid
  async function handleMarkPaid() {
    setPaidLoading(true);
    setError(null);
    setSuccessMsg(null);
    const result = await markEstimatePaidAction(project.id);
    if (result?.error) setError(result.error);
    else setSuccessMsg('Government estimate marked as PAID. File ready for meter work.');
    setPaidLoading(false);
  }

  // Handle Follow Up Log Submit
  async function handleFollowUpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!liaisoningRecord) return;
    setFollowUpLoading(true);
    setError(null);
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await logDiscomFollowUpAction(liaisoningRecord.id, project.id, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      (e.target as HTMLFormElement).reset();
      setSuccessMsg('DISCOM office visit follow-up log saved to chronological record.');
    }
    setFollowUpLoading(false);
  }

  // Handle Meter Report File Upload
  async function handleMeterFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMeterUploading(true);
    setError(null);

    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${project.id}/meter_test_report_${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('meter-reports')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
    } else if (data) {
      const { data: urlData } = supabase.storage
        .from('meter-reports')
        .getPublicUrl(fileName);
      setMeterReportUrl(urlData.publicUrl);
    }
    setMeterUploading(false);
  }

  // Handle Connection & Meter Sign-off
  async function handleCompleteConnection() {
    if (!meterReportUrl) {
      setError('Please upload the signed Meter Test Report first.');
      return;
    }

    setMeterSubmitting(true);
    setError(null);
    const result = await markConnectedAndUploadMeterReportAction(project.id, meterReportUrl);
    if (result?.error) setError(result.error);
    else setSuccessMsg('Project officially CONNECTED to grid with bidirectional meter online!');
    setMeterSubmitting(false);
  }

  // Handle CEI Form Submit
  async function handleCEISubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCeiLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateCEIRecordAction(project.id, formData);
    if (result?.error) setError(result.error);
    else setSuccessMsg('CEI statutory details updated successfully.');
    setCeiLoading(false);
  }

  const latestCEIDrawing = ceiDrawings[0] || null;

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#fcab79] bg-[#fff0eb] p-4 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-[#a8d8c4] bg-[#e8f5e9] p-4 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 0. STATUTORY PORTAL ROUTING & SCHEME SELECTION (Business Rule: Required early selection) */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#aa2d00]" />
            <div>
              <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
                Statutory Portal Routing & Scheme Selection
              </h3>
              <p className="text-[11px] text-[#5f6570]">
                Determines state vs. national registration portal, statutory filing track, and central DBT subsidy eligibility.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-mono font-bold text-[#181d26]">
              {project.category.replace('_', ' ')}
            </span>
            {liaisoningRecord?.portal_route && !isEditingRoute && canEdit && (
              <button
                type="button"
                onClick={() => setIsEditingRoute(true)}
                className="text-xs text-[#aa2d00] hover:underline font-semibold"
              >
                Change Route
              </button>
            )}
          </div>
        </div>

        {!liaisoningRecord?.portal_route && !selectedRoute && !isCommercial && (
          <div className="flex items-start gap-2 rounded-lg border border-[#fcab79] bg-[#fff0eb] p-3 text-xs text-[#aa2d00]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#aa2d00]" />
            <div>
              <strong>Action Required:</strong> Please select the statutory portal route below before proceeding with DISCOM registration. Residential projects can be routed through PM Surya Ghar (Subsidy / Non-Subsidy) or GEDA depending on client scheme eligibility.
            </div>
          </div>
        )}

        {isEditingRoute || !liaisoningRecord?.portal_route ? (
          <form onSubmit={handleSaveRoute} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Option 1: National Portal (Subsidy) */}
              <label
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-all ${
                  selectedRoute === 'NATIONAL_PORTAL_SUBSIDY'
                    ? 'border-[#aa2d00] bg-[#fff0eb]/30 ring-1 ring-[#aa2d00]'
                    : 'border-[#e0e2e6] bg-[#fafbfc] hover:border-[#b0b4ba]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#181d26]">National Portal (Subsidy)</span>
                    <input
                      type="radio"
                      name="portalRoute"
                      value="NATIONAL_PORTAL_SUBSIDY"
                      checked={selectedRoute === 'NATIONAL_PORTAL_SUBSIDY'}
                      onChange={() => setSelectedRoute('NATIONAL_PORTAL_SUBSIDY')}
                      className="text-[#aa2d00] focus:ring-[#aa2d00]"
                    />
                  </div>
                  <p className="text-[11px] text-[#5f6570]">
                    PM Surya Ghar DBT subsidy framework with direct beneficiary bank transfer.
                  </p>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#aa2d00]">
                  Central DBT Subsidy
                </span>
              </label>

              {/* Option 2: National Portal (Non-Subsidy) */}
              <label
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-all ${
                  selectedRoute === 'NATIONAL_PORTAL_NON_SUBSIDY'
                    ? 'border-[#aa2d00] bg-[#fff0eb]/30 ring-1 ring-[#aa2d00]'
                    : 'border-[#e0e2e6] bg-[#fafbfc] hover:border-[#b0b4ba]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#181d26]">National Portal (Non-Subsidy)</span>
                    <input
                      type="radio"
                      name="portalRoute"
                      value="NATIONAL_PORTAL_NON_SUBSIDY"
                      checked={selectedRoute === 'NATIONAL_PORTAL_NON_SUBSIDY'}
                      onChange={() => setSelectedRoute('NATIONAL_PORTAL_NON_SUBSIDY')}
                      className="text-[#aa2d00] focus:ring-[#aa2d00]"
                    />
                  </div>
                  <p className="text-[11px] text-[#5f6570]">
                    National portal registration without central subsidy claim.
                  </p>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#5f6570]">
                  Standard Net-Meter
                </span>
              </label>

              {/* Option 3: GEDA Portal */}
              <label
                className={`relative flex cursor-pointer flex-col justify-between rounded-lg border p-3 transition-all ${
                  selectedRoute === 'GEDA_PORTAL'
                    ? 'border-[#aa2d00] bg-[#fff0eb]/30 ring-1 ring-[#aa2d00]'
                    : 'border-[#e0e2e6] bg-[#fafbfc] hover:border-[#b0b4ba]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#181d26]">GEDA Portal</span>
                      {isCommercial && (
                        <span className="rounded bg-[#f0f2f5] px-1.5 py-0.5 text-[9px] font-bold text-[#5f6570]">
                          Default
                        </span>
                      )}
                    </div>
                    <input
                      type="radio"
                      name="portalRoute"
                      value="GEDA_PORTAL"
                      checked={selectedRoute === 'GEDA_PORTAL'}
                      onChange={() => setSelectedRoute('GEDA_PORTAL')}
                      className="text-[#aa2d00] focus:ring-[#aa2d00]"
                    />
                  </div>
                  <p className="text-[11px] text-[#5f6570]">
                    Gujarat Energy Development Agency state portal (standard default for Commercial & Industrial).
                  </p>
                </div>
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#181d26]">
                  State Regulatory Track
                </span>
              </label>
            </div>

            {/* Sub-Selection: Subsidy Type when NATIONAL_PORTAL_SUBSIDY is chosen */}
            {selectedRoute === 'NATIONAL_PORTAL_SUBSIDY' && (
              <div className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3 space-y-2">
                <label className="block text-[11px] font-bold text-[#181d26]">
                  National Portal Subsidy Scheme Type *
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded border p-2.5 ${
                      selectedSubsidyType === 'INDIVIDUAL_SUBSIDY'
                        ? 'border-[#aa2d00] bg-white ring-1 ring-[#aa2d00]'
                        : 'border-[#e0e2e6] bg-white hover:border-[#b0b4ba]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#181d26] block">Individual Subsidy</span>
                      <span className="text-[10px] text-[#5f6570]">Bungalow / Independent meter</span>
                    </div>
                    <input
                      type="radio"
                      name="subsidyType"
                      value="INDIVIDUAL_SUBSIDY"
                      checked={selectedSubsidyType === 'INDIVIDUAL_SUBSIDY'}
                      onChange={() => setSelectedSubsidyType('INDIVIDUAL_SUBSIDY')}
                      className="text-[#aa2d00]"
                    />
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded border p-2.5 ${
                      selectedSubsidyType === 'COMMON_SUBSIDY'
                        ? 'border-[#aa2d00] bg-white ring-1 ring-[#aa2d00]'
                        : 'border-[#e0e2e6] bg-white hover:border-[#b0b4ba]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#181d26] block">Common Subsidy</span>
                      <span className="text-[10px] text-[#5f6570]">Apartment / Society common meter</span>
                    </div>
                    <input
                      type="radio"
                      name="subsidyType"
                      value="COMMON_SUBSIDY"
                      checked={selectedSubsidyType === 'COMMON_SUBSIDY'}
                      onChange={() => setSelectedSubsidyType('COMMON_SUBSIDY')}
                      className="text-[#aa2d00]"
                    />
                  </label>

                  <label
                    className={`flex cursor-pointer items-center justify-between rounded border p-2.5 ${
                      selectedSubsidyType === 'NON_SUBSIDY'
                        ? 'border-[#aa2d00] bg-white ring-1 ring-[#aa2d00]'
                        : 'border-[#e0e2e6] bg-white hover:border-[#b0b4ba]'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-[#181d26] block">Non-Subsidy Track</span>
                      <span className="text-[10px] text-[#5f6570]">No financial grant claimed</span>
                    </div>
                    <input
                      type="radio"
                      name="subsidyType"
                      value="NON_SUBSIDY"
                      checked={selectedSubsidyType === 'NON_SUBSIDY'}
                      onChange={() => setSelectedSubsidyType('NON_SUBSIDY')}
                      className="text-[#aa2d00]"
                    />
                  </label>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={routeLoading || !selectedRoute}
                  className="flex items-center gap-1.5 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {routeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Confirm Statutory Route
                </button>
                {liaisoningRecord?.portal_route && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoute(liaisoningRecord.portal_route || '');
                      setIsEditingRoute(false);
                    }}
                    className="rounded border border-[#e0e2e6] px-3 py-1.5 text-xs font-semibold text-[#5f6570] hover:bg-[#f0f2f5]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5]">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#16a34a]" />
              <div>
                <span className="text-[10px] font-mono uppercase text-[#5f6570] block">Active Statutory Route:</span>
                <span className="font-bold text-[#181d26] text-xs">
                  {liaisoningRecord.portal_route === 'GEDA_PORTAL' && 'GEDA Portal (State Utility Track)'}
                  {liaisoningRecord.portal_route === 'NATIONAL_PORTAL_NON_SUBSIDY' && 'National Portal (Non-Subsidy Track)'}
                  {liaisoningRecord.portal_route === 'NATIONAL_PORTAL_SUBSIDY' && (
                    <>
                      National Portal (PM Surya Ghar Subsidy) &bull;{' '}
                      <span className="text-[#aa2d00]">
                        {liaisoningRecord.subsidy_type === 'COMMON_SUBSIDY'
                          ? 'Common Society Meter'
                          : liaisoningRecord.subsidy_type === 'NON_SUBSIDY'
                          ? 'Non-Subsidy Track'
                          : 'Individual Rooftop'}
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold text-[#0a2e0e]">
              <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
              Route Configured
            </span>
          </div>
        )}
      </div>

      {/* 1. DISCOM Online Portal Tracker & SLA Monitor */}
      <DISCOMPortalTracker
        projectId={project.id}
        records={discomRecords}
        canEdit={canEdit}
      />

      {/* Grid: 2 Columns for Standard Pipeline Steps */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* SECTION 1: Document Intake & Registration */}
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f0f2f5] pb-3">
            <FileCheck className="h-4 w-4 text-[#aa2d00]" />
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              1. Document Intake & DISCOM Application
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#181d26] block">Sales Client Documents:</span>
                <span className="text-[11px] text-[#5f6570]">
                  {liaisoningRecord?.documents_received_at
                    ? `Confirmed on ${new Date(liaisoningRecord.documents_received_at).toLocaleDateString()}`
                    : 'Awaiting Liaisoning document verification'}
                </span>
              </div>
              {liaisoningRecord?.documents_received_at ? (
                <span className="inline-flex items-center gap-1 rounded bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold text-[#0a2e0e]">
                  <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                  Verified
                </span>
              ) : canEdit ? (
                <button
                  onClick={handleConfirmDocs}
                  disabled={docLoading}
                  className="rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {docLoading ? 'Verifying...' : 'Confirm Received'}
                </button>
              ) : null}
            </div>

            <form onSubmit={handleAckSubmit} className="space-y-2 pt-1">
              <label className="block text-[11px] font-semibold text-[#181d26]">
                {(liaisoningRecord?.portal_route || selectedRoute) === 'GEDA_PORTAL'
                  ? 'GEDA Application / Acknowledgement Number'
                  : (liaisoningRecord?.portal_route || selectedRoute) === 'NATIONAL_PORTAL_SUBSIDY'
                  ? 'PM Surya Ghar National Portal Application Number'
                  : (liaisoningRecord?.portal_route || selectedRoute) === 'NATIONAL_PORTAL_NON_SUBSIDY'
                  ? 'National Portal (Non-Subsidy) Registration Number'
                  : 'DISCOM Application / Acknowledgement Number'}
              </label>
              <div className="flex gap-2">
                <input
                  name="acknowledgementNumber"
                  type="text"
                  required
                  defaultValue={liaisoningRecord?.acknowledgement_number || ''}
                  placeholder={
                    (liaisoningRecord?.portal_route || selectedRoute) === 'GEDA_PORTAL'
                      ? 'e.g. GEDA/SOL/2026/8912'
                      : (liaisoningRecord?.portal_route || selectedRoute) === 'NATIONAL_PORTAL_SUBSIDY'
                      ? 'e.g. NP-2026-98124'
                      : (liaisoningRecord?.portal_route || selectedRoute) === 'NATIONAL_PORTAL_NON_SUBSIDY'
                      ? 'e.g. NP-NS-2026-4412'
                      : 'e.g. DGVCL/ROOFTOP/2026/8912'
                  }
                  className="h-8 flex-1 rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                />
                {canEdit && (
                  <button
                    type="submit"
                    disabled={ackLoading}
                    className="rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                  >
                    {ackLoading ? 'Saving...' : 'Save Ref'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* SECTION 2: Government Estimate & Payment */}
        <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#f0f2f5] pb-3">
            <CreditCard className="h-4 w-4 text-[#16a34a]" />
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              2. Government Estimate & Challan
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <form onSubmit={handleEstimateSubmit} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Estimate Quotation #</label>
                  <input
                    name="govtEstimateQuotationNumber"
                    type="text"
                    required
                    defaultValue={liaisoningRecord?.govt_estimate_quotation_number || ''}
                    placeholder="EST-9921"
                    className="h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#181d26]">Amount (₹)</label>
                  <input
                    name="govtEstimateAmount"
                    type="number"
                    required
                    defaultValue={liaisoningRecord?.govt_estimate_amount || ''}
                    placeholder="4500"
                    className="h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                  />
                </div>
              </div>
              {canEdit && (
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={estimateLoading}
                    className="rounded border border-[#e0e2e6] bg-white px-3 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#fafbfc]"
                  >
                    {estimateLoading ? 'Saving...' : 'Update Estimate'}
                  </button>
                </div>
              )}
            </form>

            <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#181d26] block">Estimate Payment Status:</span>
                <span className="text-[11px] text-[#5f6570]">
                  {liaisoningRecord?.estimate_paid_at
                    ? `Paid on ${new Date(liaisoningRecord.estimate_paid_at).toLocaleDateString()}`
                    : 'Unpaid / Pending Treasury Payment'}
                </span>
              </div>
              {liaisoningRecord?.estimate_paid_at ? (
                <span className="inline-flex items-center gap-1 rounded bg-[#e8f5e9] px-2 py-0.5 text-[10px] font-bold text-[#0a2e0e]">
                  <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                  Paid
                </span>
              ) : canEdit ? (
                <button
                  onClick={handleMarkPaid}
                  disabled={paidLoading || !liaisoningRecord?.govt_estimate_amount}
                  className="rounded bg-[#16a34a] px-3 py-1 text-xs font-semibold text-white hover:bg-[#15803d] disabled:opacity-50"
                >
                  {paidLoading ? 'Updating...' : 'Mark Paid'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CEI Electrical Inspector Logs (if CEI Required) */}
      {project.cei_required && (
        <CEIInspectorVisitLogs
          projectId={project.id}
          logs={inspectorLogs}
          canEdit={canEdit}
        />
      )}

      {/* 3. Net Meter Testing & Calibration Card */}
      <MeterTestRecordCard
        projectId={project.id}
        records={meterRecords}
        canEdit={canEdit}
      />

      {/* 4. PM Surya Ghar / National Portal Subsidy Tracker */}
      <SubsidyReleaseTracker
        projectId={project.id}
        claims={subsidyClaims}
        canEdit={canEdit}
      />

      {/* SECTION 5: DISCOM Follow-Up Activity Log */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#aa2d00]" />
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              DISCOM Sub-Division Follow-up History ({liaisoningRecord?.follow_up_logs?.length || 0})
            </h3>
          </div>
        </div>

        {canEdit && (
          <form onSubmit={handleFollowUpSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-4 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-[#181d26]">Visit / Call Date</label>
              <input
                name="followUpDate"
                type="date"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#181d26]">Discussion Notes / Officer Met</label>
              <input
                name="note"
                type="text"
                required
                placeholder="e.g. Met Jr. Engineer Mr. Patel; estimate approved, file sent for meter test."
                className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={followUpLoading}
                className="h-8 w-full rounded bg-[#181d26] font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
              >
                {followUpLoading ? 'Logging...' : 'Log Follow-up'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {!liaisoningRecord?.follow_up_logs || liaisoningRecord.follow_up_logs.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#9297a0]">No sub-division follow-up logs recorded yet.</p>
          ) : (
            liaisoningRecord.follow_up_logs.map((log) => (
              <div key={log.id} className="rounded border border-[#f0f2f5] bg-[#fafbfc] p-2.5 text-xs flex justify-between">
                <p className="text-[#181d26]">{log.note}</p>
                <span className="text-[10px] text-[#5f6570] shrink-0 ml-2">
                  {new Date(log.follow_up_date).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 6: Grid Connection & Meter Charging */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#f0f2f5] pb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Grid Synchronization & Charging Sign-off
          </h3>
        </div>

        <div className="text-xs space-y-3">
          {liaisoningRecord?.connected_at ? (
            <div className="rounded-lg bg-[#e8f5e9] p-4 border border-[#a8d8c4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
                <div>
                  <h4 className="font-bold text-[#0a2e0e]">Solar Plant Synchronized & Live on Grid!</h4>
                  <p className="text-[11px] text-[#0a2e0e]">
                    Connected on {new Date(liaisoningRecord.connected_at).toLocaleString()}
                  </p>
                </div>
              </div>
              {liaisoningRecord.meter_report_url && (
                <a
                  href={liaisoningRecord.meter_report_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-[#a8d8c4] bg-white px-3 py-1 text-xs font-semibold text-[#0a2e0e] hover:bg-[#fafbfc]"
                >
                  View Meter Report
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[#5f6570]">
                Upload official DISCOM bidirectional meter test certificate / charging order to complete grid synchronization.
              </p>

              <div className="flex gap-2">
                <input
                  type="url"
                  value={meterReportUrl}
                  onChange={(e) => setMeterReportUrl(e.target.value)}
                  placeholder="https://... or choose file"
                  className="h-8 flex-1 rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                />
                <label className="flex h-8 cursor-pointer items-center gap-1 rounded border border-[#e0e2e6] bg-white px-3 text-[11px] font-medium text-[#181d26] hover:bg-[#fafbfc]">
                  {meterUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  Upload Report
                  <input type="file" onChange={handleMeterFileUpload} className="hidden" />
                </label>
              </div>

              {canEdit && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleCompleteConnection}
                    disabled={meterSubmitting || !meterReportUrl}
                    className="flex items-center gap-1.5 rounded bg-[#16a34a] px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#15803d] disabled:opacity-50"
                  >
                    {meterSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    Mark Connected & Complete Project
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
