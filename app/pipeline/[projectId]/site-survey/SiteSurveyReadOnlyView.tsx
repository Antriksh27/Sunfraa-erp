'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Calendar,
  User,
  Zap,
  FileText,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Project, SiteSurvey, UserRole } from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

interface SiteSurveyReadOnlyViewProps {
  project: Project;
  existingSurvey: (SiteSurvey & { surveyed_by?: { name: string } | null }) | null;
  userRole: UserRole;
}

export default function SiteSurveyReadOnlyView({
  project,
  existingSurvey,
  userRole,
}: SiteSurveyReadOnlyViewProps) {
  const isCompleted = Boolean(existingSurvey);

  return (
    <div className="mx-auto max-w-4xl space-y-6 font-sans">
      {/* Top Header Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={getProjectUrlForRole(project.id, userRole)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5f6570] hover:text-[#181d26] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Project
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#181d26]">{project.client_name}</h1>
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-2.5 py-0.5 text-xs font-bold text-[#15803d] border border-[#a8d8c4]">
                  <CheckCircle2 className="h-3 w-3 text-[#16a34a]" />
                  Survey Completed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Awaiting Survey
                </span>
              )}
            </div>
            <p className="text-xs text-[#5f6570] mt-0.5">
              {project.kw_required} kW • {project.category.replace('_', ' ')} • {project.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fff0eb] px-3 py-1.5 text-xs font-semibold text-[#aa2d00] border border-[#fcab79]">
            <Shield className="h-3.5 w-3.5 text-[#aa2d00]" />
            Read-Only (Sales Coordination)
          </span>
        </div>
      </div>

      {/* Role Banner */}
      <div className="rounded-lg border border-[#f5e9d4] bg-[#fff0eb]/60 p-4 text-xs text-[#882400] flex items-start gap-3">
        <Shield className="h-4 w-4 shrink-0 text-[#aa2d00] mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Sales Role Permission Notice</p>
          <p className="text-[#aa2d00]">
            Per company operating procedures, Sales role handles lead coordination and scheduling only.
            Technical site measurements, electrical parameters, and survey data entry are restricted to
            Site Execution engineers.
          </p>
        </div>
      </div>

      {isCompleted && existingSurvey ? (
        /* Completed Survey Summary */
        <div className="space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-[#9297a0] block">Proposed Panels</span>
              <span className="text-2xl font-bold text-[#181d26] mt-1 block">
                {existingSurvey.no_of_panels} Panels
              </span>
              <span className="text-[11px] text-[#5f6570] mt-0.5 block">
                Estimated ~{(existingSurvey.no_of_panels * 0.55).toFixed(1)} kW DC capacity
              </span>
            </div>

            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-[#9297a0] block">On-Site Contact Person</span>
              <span className="text-base font-bold text-[#181d26] mt-1 block">
                {existingSurvey.contacted_person}
              </span>
              <span className="text-[11px] text-[#5f6570] mt-0.5 block">
                Client Representative met on-site
              </span>
            </div>

            <div className="rounded-xl border border-[#e0e2e6] bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-medium text-[#9297a0] block">GPS Coordinates</span>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-bold text-[#181d26] truncate">
                  {existingSurvey.gps_location}
                </span>
                {existingSurvey.gps_location && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(existingSurvey.gps_location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-[#fff0eb] px-2 py-1 text-[10px] font-bold text-[#aa2d00] hover:bg-[#f5e9d4]"
                  >
                    <MapPin className="h-3 w-3 text-[#aa2d00]" />
                    Maps
                  </a>
                )}
              </div>
              <span className="text-[11px] text-[#5f6570] mt-0.5 block">
                Geo-verified rooftop location
              </span>
            </div>
          </div>

          {/* Roof & Physical Measurements */}
          <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
              Roof Structure & Physical Measurements
            </h3>
            <div className="rounded-lg bg-[#fafbfc] p-4 text-xs text-[#181d26] border border-[#f0f2f5] whitespace-pre-wrap leading-relaxed">
              {existingSurvey.physical_measurement}
            </div>
          </div>

          {/* Grid & Electrical Parameters */}
          <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
              Electrical Service & Sanctioned Connection
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5]">
                <span className="text-[11px] text-[#9297a0] block">Sanctioned Load</span>
                <span className="text-sm font-semibold text-[#181d26] mt-0.5 block">
                  {project.sanctioned_load || 'Not specified'}
                </span>
              </div>
              <div className="rounded-lg bg-[#fafbfc] p-3 border border-[#f0f2f5]">
                <span className="text-[11px] text-[#9297a0] block">DISCOM Consumer / Connection #</span>
                <span className="text-sm font-semibold text-[#181d26] mt-0.5 block">
                  {project.connection_number || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          {existingSurvey.photo_urls && existingSurvey.photo_urls.length > 0 && (
            <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
                  Site Photographs ({existingSurvey.photo_urls.length})
                </h3>
                <span className="text-[11px] text-[#9297a0]">Click any photo to open full resolution</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {existingSurvey.photo_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5] shadow-2xs"
                  >
                    <img
                      src={url}
                      alt={`Site survey photo ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Diagrams Gallery */}
          {existingSurvey.diagram_urls && existingSurvey.diagram_urls.length > 0 && (
            <div className="rounded-xl border border-[#e0e2e6] bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#9297a0]">
                Uploaded Layout Sketches & Single Line Diagrams ({existingSurvey.diagram_urls.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {existingSurvey.diagram_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-lg border border-[#e0e2e6] bg-[#f0f2f5]"
                  >
                    <img
                      src={url}
                      alt={`Survey diagram ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <ExternalLink className="h-5 w-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Surveyor Verification Stamp */}
          <div className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-4 text-xs text-[#41454d] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="font-semibold text-[#181d26]">
                Surveyed by: {existingSurvey.surveyed_by?.name || 'Site Execution Engineer'}
              </span>
              <p className="text-[11px] text-[#9297a0] mt-0.5">
                Completed on {new Date(existingSurvey.surveyed_at).toLocaleString()}
              </p>
            </div>
            <Link
              href={getProjectUrlForRole(project.id, userRole)}
              className="inline-flex items-center gap-1 rounded-lg bg-[#181d26] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#181d26] transition-colors"
            >
              Continue to Quotation & Proposal
            </Link>
          </div>
        </div>
      ) : (
        /* Awaiting Survey Empty State */
        <div className="rounded-xl border border-[#e0e2e6] bg-white p-10 text-center shadow-2xs space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
            <Clock className="h-8 w-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-base font-bold text-[#181d26]">Awaiting Site Survey Execution</h2>
            <p className="text-xs text-[#5f6570] leading-relaxed">
              The technical survey for <strong className="text-[#333840]">{project.client_name}</strong> has not been conducted yet.
              Physical measurements, panel counts, and geo-tagged photographs will appear here once submitted by the Site Execution team.
            </p>
          </div>

          {/* Coordination Details */}
          <div className="mx-auto max-w-sm rounded-lg bg-[#fafbfc] p-4 border border-[#f0f2f5] text-xs text-left space-y-2">
            <div className="flex justify-between items-center text-[#41454d]">
              <span className="text-[#9297a0]">Current Stage:</span>
              <span className="font-semibold text-[#181d26]">{project.stage}</span>
            </div>
            <div className="flex justify-between items-center text-[#41454d]">
              <span className="text-[#9297a0]">Scheduled Date:</span>
              <span className="font-semibold text-[#181d26]">
                {project.survey_scheduled_date
                  ? new Date(project.survey_scheduled_date).toLocaleDateString()
                  : 'Pending Schedule'}
              </span>
            </div>
            <div className="flex justify-between items-center text-[#41454d]">
              <span className="text-[#9297a0]">Assigned Engineer:</span>
              <span className="font-semibold text-[#181d26]">
                {project.survey_assigned_engineer?.name || 'Unassigned'}
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Link
              href={getProjectUrlForRole(project.id, userRole)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#181d26] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#181d26] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Return to Project Pipeline
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
