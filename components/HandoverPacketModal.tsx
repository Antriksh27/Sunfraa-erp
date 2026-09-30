'use client';

import { useRef } from 'react';
import {
  Project,
  SiteSurvey,
  ExecutionStageProgress,
  ExecutionCompletion,
} from '@/types/database';
import { Printer, X, Zap, CheckCircle2, ShieldCheck, MapPin, Camera } from 'lucide-react';

interface HandoverPacketModalProps {
  project: Project;
  survey: SiteSurvey | null;
  stageProgress: ExecutionStageProgress[];
  completion: ExecutionCompletion | null;
  onClose: () => void;
}

export default function HandoverPacketModal({
  project,
  survey,
  stageProgress,
  completion,
  onClose,
}: HandoverPacketModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="print:hidden flex items-center justify-between border-b border-[#e0e2e6] bg-[#fafbfc] px-6 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#16a34a]" />
            <span className="text-sm font-bold text-[#181d26]">Project Handover & Commissioning Packet</span>
            <span className="rounded bg-[#16a34a] px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              Verified Complete
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-md bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-[#9297a0] hover:text-[#181d26]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Packet Document */}
        <div ref={printRef} className="p-8 overflow-y-auto font-sans text-xs space-y-6 text-[#181d26]">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#e0e2e6] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Sunfraa Global"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#5f6570]">
                Clean Energy EPC & Rooftop Solar Engineering Solutions
              </p>
              <p className="text-[10px] text-[#5f6570]">
                Commissioning Division • QA/QC Handover Report
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-[#16a34a]">
                SITE HANDOVER DOSSIER
              </span>
              <p className="text-[11px] font-bold text-[#181d26] mt-0.5">
                Date: {completion?.completed_at ? new Date(completion.completed_at).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          {/* Project & Client Card */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-[#fafbfc] p-4 border border-[#f0f2f5]">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">Client & Site Location:</span>
              <p className="text-sm font-bold text-[#181d26] mt-0.5">{project.client_name}</p>
              <p className="text-[11px] text-[#41454d] mt-0.5">{project.address}</p>
              <p className="text-[11px] text-[#41454d]">Contact Phone: {project.phone}</p>
              <p className="text-[10px] text-[#5f6570] mt-1">Consumer #: {project.connection_number || 'N/A'}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-[#5f6570]">System Specifications:</span>
              <p className="text-sm font-bold text-[#181d26] mt-0.5">{project.kw_required} kW Rooftop Solar PV</p>
              <p className="text-[11px] text-[#41454d]">Category: {project.category.replace(/_/g, ' ')}</p>
              <p className="text-[11px] text-[#41454d]">
                Inverter Serial: <strong>{completion?.inverter_serial_number || 'N/A'}</strong>
              </p>
              <p className="text-[10px] text-[#5f6570] mt-1">
                Panel Count: {completion?.panel_count || survey?.no_of_panels || 0} Modules Installed
              </p>
            </div>
          </div>

          {/* 4-Stage Execution Sign-Off Verification */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26] border-b border-[#f0f2f5] pb-1.5">
              Verified Stage Milestones & Sign-Offs (4 of 4 Completed)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stageProgress.map((sp) => {
                const photos = sp.photo_urls && sp.photo_urls.length > 0 ? sp.photo_urls : sp.photo_url ? [sp.photo_url] : [];
                return (
                  <div key={sp.id} className="rounded-lg border border-[#e0e2e6] p-3 space-y-2 bg-[#ffffff]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#181d26]">
                        {sp.stage.replace(/_/g, ' ')}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-[#e8f5e9] px-2 py-0.5 text-[9px] font-bold text-[#0a2e0e]">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Signed Off
                      </span>
                    </div>

                    <p className="text-[10px] text-[#5f6570]">
                      Completed: {new Date(sp.completed_at).toLocaleDateString()} • {sp.completed_by?.name || 'Engineer'}
                    </p>

                    {sp.comment && (
                      <p className="text-[11px] text-[#333840] italic bg-[#fafbfc] p-1.5 rounded">
                        &quot;{sp.comment}&quot;
                      </p>
                    )}

                    {photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {photos.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="aspect-square rounded overflow-hidden border border-[#e0e2e6] bg-[#fafbfc]">
                            <img src={url} alt="Stage Photo" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Serial Numbers Record */}
          {completion && completion.panel_serial_numbers && completion.panel_serial_numbers.length > 0 && (
            <div className="space-y-2 rounded-lg border border-[#e0e2e6] p-4 bg-[#fafbfc]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#181d26]">
                Installed Solar PV Module Barcode / Serial Register ({completion.panel_serial_numbers.length} Units)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {completion.panel_serial_numbers.map((sn, idx) => (
                  <span key={idx} className="rounded border border-[#e0e2e6] bg-white px-2 py-0.5 text-[10px] font-mono text-[#181d26]">
                    {sn}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Signatures & Certification */}
          <div className="border-t border-[#e0e2e6] pt-8 grid grid-cols-2 gap-8 text-[11px]">
            <div className="border-t border-dashed border-[#9297a0] pt-2 text-center">
              <p className="font-bold text-[#181d26]">Project Site Execution Engineer</p>
              <p className="text-[10px] text-[#5f6570]">Sunfraa Solar Global Ltd</p>
            </div>
            <div className="border-t border-dashed border-[#9297a0] pt-2 text-center">
              <p className="font-bold text-[#181d26]">Client / Customer Representative</p>
              <p className="text-[10px] text-[#5f6570]">Acceptance & Installation Verified</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
