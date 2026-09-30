'use client';

import { useState } from 'react';
import { MeterTestRecord } from '@/types/database';
import { saveMeterTestRecordAction } from '@/app/design/../liaisoning/actions';
import { Gauge, Plus, X, Loader2, CheckCircle2, AlertCircle, ExternalLink, FileCheck } from 'lucide-react';

interface MeterTestRecordCardProps {
  projectId: string;
  records: MeterTestRecord[];
  canEdit: boolean;
}

export default function MeterTestRecordCard({
  projectId,
  records,
  canEdit,
}: MeterTestRecordCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [meterSerial, setMeterSerial] = useState('');
  const [ctPtRatio, setCtPtRatio] = useState('Whole Current (Direct)');
  const [testReportNumber, setTestReportNumber] = useState('');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [passed, setPassed] = useState(true);
  const [testReportUrl, setTestReportUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await saveMeterTestRecordAction(projectId, {
      meterSerialNumber: meterSerial,
      ctPtRatio: ctPtRatio || undefined,
      testReportNumber,
      testDate,
      passed,
      testReportUrl: testReportUrl || undefined,
    });

    if (res?.error) {
      setError(res.error);
    } else {
      setShowModal(false);
      setMeterSerial('');
      setTestReportNumber('');
      setTestReportUrl('');
    }
    setLoading(false);
  }

  const latestPassed = records.find((r) => r.passed);

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#16a34a]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            DISCOM Net Meter Testing & Calibration Register ({records.length})
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-[#0d1218]"
          >
            <Plus className="h-3 w-3" />
            Log Meter Test
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#9297a0]">
          No bidirectional meter test records logged yet. Required prior to charging approval.
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <div key={r.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#181d26]">Meter S/N: {r.meter_serial_number}</span>
                  <span className="text-[11px] text-[#5f6570]">({r.ct_pt_ratio || 'Direct'})</span>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    r.passed ? 'bg-[#e8f5e9] text-[#0a2e0e]' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {r.passed ? 'Test Passed / Certified' : 'Calibration Failed'}
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-[#5f6570]">
                <span>Report #{r.test_report_number}</span>
                <span>Date: {new Date(r.test_date).toLocaleDateString()}</span>
              </div>

              {r.test_report_url && (
                <div className="pt-1 border-t border-[#f0f2f5] text-right">
                  <a
                    href={r.test_report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#aa2d00] hover:underline text-[11px]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Download Calibration Test Report (PDF)
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Meter Test Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e0e2e6] pb-3">
              <h3 className="text-sm font-bold text-[#181d26]">Log Net Meter Calibration Test</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-[#9297a0] hover:text-[#181d26]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && <p className="text-xs text-[#aa2d00]">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Meter Serial Number *</label>
                <input
                  type="text"
                  required
                  value={meterSerial}
                  onChange={(e) => setMeterSerial(e.target.value)}
                  placeholder="e.g. L&T-GEN3-998822"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">CT/PT Ratio Specification</label>
                <input
                  type="text"
                  value={ctPtRatio}
                  onChange={(e) => setCtPtRatio(e.target.value)}
                  placeholder="e.g. 100/5A or Whole Current"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Test Report Number *</label>
                <input
                  type="text"
                  required
                  value={testReportNumber}
                  onChange={(e) => setTestReportNumber(e.target.value)}
                  placeholder="e.g. TR-LAB-2026-4421"
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Testing Date *</label>
                <input
                  type="date"
                  required
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="mt-1 h-8 block w-full rounded border border-[#e0e2e6] px-2 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={passed}
                  onChange={(e) => setPassed(e.target.checked)}
                  className="h-4 w-4 rounded border-[#e0e2e6] text-[#181d26]"
                />
                <span className="font-semibold text-[#181d26]">Calibration Passed (Accuracy Class 0.5s / 1.0)</span>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-[#181d26]">Test Report File URL</label>
                <input
                  type="url"
                  value={testReportUrl}
                  onChange={(e) => setTestReportUrl(e.target.value)}
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
                  disabled={loading || !meterSerial || !testReportNumber}
                  className="rounded bg-[#181d26] px-4 py-1.5 font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Test Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
