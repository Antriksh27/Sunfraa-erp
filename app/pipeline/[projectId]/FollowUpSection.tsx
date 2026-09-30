'use client';

import { useState } from 'react';
import { acknowledgeFollowUpAction } from '@/app/pipeline/actions';
import { BellRing, Check, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { FollowUpLog } from '@/types/database';

interface FollowUpSectionProps {
  logs: FollowUpLog[];
  projectId: string;
  canEdit: boolean;
}

export default function FollowUpSection({ logs, projectId, canEdit }: FollowUpSectionProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAcknowledge(logId: string) {
    setLoadingId(logId);
    setError(null);
    const res = await acknowledgeFollowUpAction(logId, projectId);
    if (res?.error) {
      setError(res.error);
    }
    setLoadingId(null);
  }

  return (
    <div className="rounded-xl border border-[#e0e2e6] bg-white p-5 shadow-sm space-y-4">
      {error && (
        <div className="rounded-md border border-[#fcab79] bg-[#fff0eb] p-2.5 text-xs text-[#aa2d00]">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[#181d26]">Sales Follow-Up Cadence (3-Day)</h3>
        </div>
        <span className="rounded-full bg-[#f0f2f5] px-2 py-0.5 text-xs font-semibold text-[#41454d]">
          {logs.length} Reminders
        </span>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-[#5f6570]">
          No follow-up reminders yet. Reminders generate every 3 days while quotation is pending customer approval.
        </p>
      ) : (
        <div className="divide-y divide-[#f0f2f5]">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2.5">
                {log.acknowledged ? (
                  <CheckCircle2 className="h-4 w-4 text-[#16a34a]" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500" />
                )}
                <div>
                  <p className="text-xs font-semibold text-[#181d26]">
                    Follow-Up Reminder — {new Date(log.reminder_sent_at).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-[#9297a0]">
                    Generated at {new Date(log.reminder_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div>
                {log.acknowledged ? (
                  <span className="text-[11px] font-semibold text-[#16a34a]">
                    Acknowledged
                  </span>
                ) : canEdit ? (
                  <button
                    onClick={() => handleAcknowledge(log.id)}
                    disabled={loadingId === log.id}
                    className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50"
                  >
                    {loadingId === log.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Acknowledge
                  </button>
                ) : (
                  <span className="text-[11px] font-medium text-amber-600">Pending Call</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
