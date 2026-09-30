'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  uploadDesignFileAction,
  flagDesignRevisionAction,
} from '@/app/design/actions';
import {
  Compass,
  FileCheck2,
  Camera,
  Upload,
  Download,
  ExternalLink,
  History,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  FileText,
  AlertTriangle,
  X,
  Layers,
} from 'lucide-react';
import {
  Project,
  SiteSurvey,
  DesignFile,
  DesignFileType,
  CEIChecklist,
  SLDSpecification,
} from '@/types/database';
import CEIChecklistSection from '@/components/CEIChecklistSection';
import SLDBuilderSection from '@/components/SLDBuilderSection';

interface DesignWorkspaceProps {
  project: Project;
  siteSurvey: (SiteSurvey & { surveyed_by?: { name: string } | null }) | null;
  designFiles: (DesignFile & { uploaded_by?: { name: string } | null })[];
  ceiChecklist?: CEIChecklist | null;
  sldSpecification?: SLDSpecification | null;
  canEdit: boolean;
}

const DRAWING_TYPES: { type: DesignFileType; label: string; desc: string }[] = [
  { type: 'INITIAL', label: 'Initial Design / GA Drawing', desc: 'General arrangement 2D CAD layout' },
  { type: 'CEI_DRAWING', label: 'CEI Statutory Drawing', desc: 'Chief Electrical Inspector compliance layout' },
];

export default function DesignWorkspace({
  project,
  siteSurvey,
  designFiles,
  ceiChecklist = null,
  sldSpecification = null,
  canEdit,
}: DesignWorkspaceProps) {
  const [selectedType, setSelectedType] = useState<DesignFileType>('INITIAL');
  const [versionNotes, setVersionNotes] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  // Revision Dialog state
  const [revisingFile, setRevisingFile] = useState<DesignFile | null>(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [revisionLoading, setRevisionLoading] = useState(false);

  // Handle file upload to Supabase storage bucket `design-files`
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${project.id}/${selectedType.toLowerCase()}_${Date.now()}.${fileExt}`;

    const { data, error: uploadError } = await supabase.storage
      .from('design-files')
      .upload(fileName, file);

    if (uploadError) {
      setError(`Storage upload failed: ${uploadError.message}`);
    } else if (data) {
      const { data: urlData } = supabase.storage
        .from('design-files')
        .getPublicUrl(fileName);
      setUploadedUrl(urlData.publicUrl);
    }

    setUploading(false);
  }

  // Handle recording the Design File version
  async function handleRecordDesignFile() {
    if (!uploadedUrl) {
      setError('Please select and upload a CAD / PDF file first.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await uploadDesignFileAction(project.id, selectedType, uploadedUrl, versionNotes);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccessMsg(`Design drawing version v${result.version} recorded with changelog notes.`);
      setUploadedUrl('');
      setVersionNotes('');
    }

    setSubmitting(false);
  }

  async function handleConfirmRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!revisingFile) return;
    setRevisionLoading(true);

    const res = await flagDesignRevisionAction(revisingFile.id, project.id, revisionComments);
    if (res?.error) {
      setError(res.error);
    } else {
      setRevisingFile(null);
      setRevisionComments('');
      setSuccessMsg('Drawing marked as NEEDS_REVISION.');
    }
    setRevisionLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-[#fcab79] bg-[#fff0eb] p-4 text-xs text-[#aa2d00]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-[#a8d8c4] bg-[#e8f5e9] p-4 text-xs text-[#0a2e0e]">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16a34a]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1. SLD Technical Generator */}
      <SLDBuilderSection
        projectId={project.id}
        defaultKw={Number(project.kw_required) || 5}
        specification={sldSpecification}
        canEdit={canEdit}
      />

      {/* 2. Mandatory CEI Checklist (if CEI required) */}
      {project.cei_required && (
        <CEIChecklistSection
          projectId={project.id}
          checklist={ceiChecklist}
          canEdit={canEdit}
        />
      )}

      {/* 3. Design Files Upload & Versioning Workspace */}
      <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#181d26]" />
            <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
              CAD Drawings & Document Revision Vault ({designFiles.length} files)
            </h3>
          </div>
        </div>

        {/* Upload Form */}
        {canEdit && (
          <div className="rounded-lg bg-[#fafbfc] p-4 border border-[#e0e2e6] space-y-4 text-xs">
            <h4 className="font-bold text-[#181d26]">Upload New Version / Drawing Type</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Drawing Type *</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DesignFileType)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                >
                  {DRAWING_TYPES.map((dt) => (
                    <option key={dt.type} value={dt.type}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">
                  File Upload (CAD DWG / PDF / Image) *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="url"
                    value={uploadedUrl}
                    onChange={(e) => setUploadedUrl(e.target.value)}
                    placeholder="https://... or choose file below"
                    className="h-8 flex-1 rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                  />
                  <label className="flex h-8 cursor-pointer items-center gap-1 rounded border border-[#e0e2e6] bg-white px-3 text-[11px] font-medium text-[#181d26] hover:bg-[#f8fafc]">
                    {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                    Upload
                    <input type="file" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#181d26]">
                  Version Changelog Notes (What changed from previous drawing?) *
                </label>
                <input
                  type="text"
                  required
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  placeholder="e.g. Updated string count to 3 strings; shifted inverter location closer to ACDB."
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleRecordDesignFile}
                disabled={submitting || !uploadedUrl}
                className="flex items-center gap-1 rounded bg-[#181d26] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Publish Version
              </button>
            </div>
          </div>
        )}

        {/* Grouped Drawing History */}
        <div className="space-y-4">
          {DRAWING_TYPES.map((dt) => {
            const files = designFiles.filter((f) => f.type === dt.type);
            return (
              <div key={dt.type} className="rounded-lg border border-[#e0e2e6] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#181d26]">{dt.label}</h4>
                    <p className="text-[10px] text-[#5f6570]">{dt.desc}</p>
                  </div>
                  <span className="rounded bg-[#f0f2f5] px-2 py-0.5 text-[10px] font-bold text-[#333840]">
                    {files.length} Version(s)
                  </span>
                </div>

                {files.length === 0 ? (
                  <p className="text-[11px] text-[#9297a0] italic">No versions uploaded yet.</p>
                ) : (
                  <div className="divide-y divide-[#f0f2f5] text-xs">
                    {files.map((file) => (
                      <div key={file.id} className="py-2 flex items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#181d26]">v{file.version}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                file.status === 'NEEDS_REVISION'
                                  ? 'bg-[#fff0eb] text-[#aa2d00] border border-[#fcab79]'
                                  : 'bg-[#e8f5e9] text-[#0a2e0e]'
                              }`}
                            >
                              {file.status || 'APPROVED'}
                            </span>
                          </div>
                          {file.version_notes && (
                            <p className="text-[11px] text-[#333840]">&quot;{file.version_notes}&quot;</p>
                          )}
                          {file.revision_comments && (
                            <p className="text-[10px] text-[#aa2d00] italic">
                              Revision Requested: {file.revision_comments}
                            </p>
                          )}
                          <p className="text-[10px] text-[#5f6570]">
                            Uploaded {new Date(file.uploaded_at).toLocaleString()} • {file.uploaded_by?.name || 'Engineer'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 rounded border border-[#e0e2e6] bg-white px-2.5 py-1 text-xs font-semibold text-[#181d26] hover:bg-[#f8fafc]"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                          {canEdit && file.status !== 'NEEDS_REVISION' && (
                            <button
                              type="button"
                              onClick={() => setRevisingFile(file)}
                              className="rounded bg-[#fff0eb] border border-[#fcab79] px-2.5 py-1 text-xs font-semibold text-[#aa2d00] hover:bg-[#ffe5dc]"
                            >
                              Request Revision
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Request Revision Dialog */}
      {revisingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3 text-[#aa2d00]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="text-sm font-bold">Request Design Revision</h3>
              </div>
              <button type="button" onClick={() => setRevisingFile(null)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevision} className="space-y-3 text-xs">
              <p className="text-[11px] text-[#5f6570]">
                Flagging <strong>{revisingFile.type} v{revisingFile.version}</strong> will move this project to the <strong>&quot;Revisions Required&quot;</strong> queue.
              </p>

              <div>
                <label className="block font-semibold text-[#181d26]">Revision Comments / Correction Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={revisionComments}
                  onChange={(e) => setRevisionComments(e.target.value)}
                  placeholder="e.g. Inverter location interferes with AC ducting on Terrace floor. Please relocate to East parapet."
                  className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setRevisingFile(null)} className="rounded px-3 py-1.5 text-[#5f6570]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revisionLoading || !revisionComments.trim()}
                  className="rounded bg-[#aa2d00] px-4 py-1.5 font-semibold text-white hover:bg-[#882400] disabled:opacity-50"
                >
                  {revisionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Flag Revision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
