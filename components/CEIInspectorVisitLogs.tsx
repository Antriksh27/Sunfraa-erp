'use client';

import { useState } from 'react';
import { CEIInspectorLog } from '@/types/database';
import { saveCEIInspectorLogAction } from '@/app/design/../liaisoning/actions';
import { ShieldCheck, Plus, X, Loader2, CheckCircle2, User, Phone, Calendar, ExternalLink } from 'lucide-react';

interface CEIInspectorVisitLogsProps {
  projectId: string;
  logs: CEIInspectorLog[];
  canEdit: boolean;
}

export default function CEIInspectorVisitLogs({
  projectId,
  logs,
  canEdit,
}: CEIInspectorVisitLogsProps) {
  const [showModal, setShowModal] = useState(false);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectorPhone, setInspectorPhone] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitCompleted, setVisitCompleted] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await saveCEIInspectorLogAction(projectId, {
      inspectorName,
      inspectorPhone: inspectorPhone || undefined,
      scheduledDate,
      visitCompleted,
      reportNotes: reportNotes || undefined,
      certificateUrl: certificateUrl || undefined,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setInspectorName('');
      setInspectorPhone('');
      setReportNotes('');
      setCertificateUrl('');
    }
    setLoading(false);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-600" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            CEI Electrical Inspector Visit Schedule & Logs ({logs.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Log Inspector Visit
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#9297a0]">
          No CEI electrical inspector visits recorded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#181d26]">
                  <User className="h-3.5 w-3.5 text-[#5f6570]" />
                  <span>{log.inspector_name}</span>
                  {log.inspector_phone && (
                    <span className="flex items-center gap-1 text-[11px] font-normal text-[#5f6570]">
                      <Phone className="h-3 w-3" />
                      {log.inspector_phone}
                    </span>
                  )}
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    log.visit_completed ? 'bg-[#e8f5e9] text-[#0a2e0e]' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {log.visit_completed ? 'Visit Completed' : 'Scheduled Visit'}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[#5f6570]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date: {new Date(log.scheduled_date).toLocaleDateString()}
                </span>
              </div>

              {log.report_notes && (
                <p className="text-[11px] text-[#333840] bg-white p-2 rounded border border-[#f0f2f5]">
                  &quot;{log.report_notes}&quot;
                </p>
              )}

              {log.certificate_url && (
                <div className="pt-1 border-t border-[#f0f2f5] text-right">
                  <a
                    href={log.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#aa2d00] hover:underline text-[11px]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View CEI Safety Certificate
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Visit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Log CEI Inspector Visit</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Inspector Name *</label>
                <input
                  type="text"
                  required
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="e.g. Er. Rajesh Dave (Assistant Electrical Inspector)"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Inspector Phone</label>
                <input
                  type="text"
                  value={inspectorPhone}
                  onChange={(e) => setInspectorPhone(e.target.value)}
                  placeholder="+91 98240 11223"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Inspection Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitCompleted}
                  onChange={(e) => setVisitCompleted(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26]"
                />
                <span className="font-semibold text-[#181d26]">Inspection Visit Completed</span>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Inspector Notes / Directives</label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="e.g. Earthing resistance tested at 2.4 ohms. Transformer neutral earthing verified."
                  className="mt-1 block w-full rounded border border-[#e0e2e6] p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Certificate / Order URL</label>
                <input
                  type="url"
                  value={certificateUrl}
                  onChange={(e) => setCertificateUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e2e6]">
                <button type="button" onClick={() => setShowModal(false)} className="rounded px-3 py-1.5 text-[#5f6570]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !inspectorName}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
