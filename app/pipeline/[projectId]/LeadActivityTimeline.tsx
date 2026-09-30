'use client';

import { useState } from 'react';
import { LeadActivity, LeadActivityType } from '@/types/database';
import { addLeadActivityAction, deleteLeadActivityAction } from '@/app/pipeline/actions';
import {
  MessageSquare,
  PhoneCall,
  Users,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Send,
} from 'lucide-react';

interface LeadActivityTimelineProps {
  projectId: string;
  activities: LeadActivity[];
  currentUserId: string;
}

const TYPE_ICONS: Record<LeadActivityType, any> = {
  NOTE: MessageSquare,
  CALL: PhoneCall,
  MEETING: Users,
};

const TYPE_COLORS: Record<LeadActivityType, string> = {
  NOTE: 'bg-[#fff0eb] text-[#aa2d00] border-[#fcab79]',
  CALL: 'bg-[#e8f5e9] text-[#15803d] border-[#a8d8c4]',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function LeadActivityTimeline({
  projectId,
  activities,
  currentUserId,
}: LeadActivityTimelineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<LeadActivityType>('NOTE');
  const [content, setContent] = useState('');
  const [callOutcome, setCallOutcome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set('type', type);
    formData.set('content', content.trim());
    if (type === 'CALL') {
      formData.set('callOutcome', callOutcome);
    }

    const res = await addLeadActivityAction(projectId, formData);
    if (res?.error) {
      setError(res.error);
    } else {
      setContent('');
      setCallOutcome('');
      setIsAdding(false);
    }
    setLoading(false);
  }

  async function handleDelete(activityId: string) {
    await deleteLeadActivityAction(activityId, projectId);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#181d26]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#181d26]">
            Activity Timeline ({activities.length})
          </h3>
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 rounded-md bg-[#181d26] px-2.5 py-1 text-xs font-medium text-white shadow-2xs hover:bg-[#0d1218] transition-colors"
          >
            <Plus className="h-3 w-3" />
            Log Activity
          </button>
        )}
      </div>

      {/* Add Activity Inline Form */}
      {isAdding && (
        <form onSubmit={handleAddActivity} className="rounded-lg border border-[#e0e2e6] bg-[#f8fafc] p-3.5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#41454d]">Activity Type:</span>
            <div className="flex rounded-md border border-[#e0e2e6] bg-white p-0.5">
              {(['NOTE', 'CALL', 'MEETING'] as LeadActivityType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded px-2.5 py-0.5 text-xs font-medium transition ${
                    type === t ? 'bg-[#181d26] text-white' : 'text-[#41454d] hover:text-[#181d26]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {type === 'CALL' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#41454d]">Call Outcome</label>
              <select
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                className="mt-1 h-7 block w-full rounded border border-[#e0e2e6] bg-white px-2 text-xs text-[#181d26] focus:border-[#181d26] focus:outline-none"
              >
                <option value="">Select outcome...</option>
                <option value="CONNECTED_INTERESTED">Connected — Interested</option>
                <option value="CALLBACK_REQUESTED">Callback Requested</option>
                <option value="BUSY_NO_ANSWER">Busy / No Answer</option>
                <option value="WRONG_NUMBER">Wrong Number</option>
                <option value="NOT_INTERESTED">Not Interested</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#41454d]">
              {type === 'NOTE' ? 'Note Details' : type === 'CALL' ? 'Call Discussion Notes' : 'Meeting Minutes'}
            </label>
            <textarea
              rows={2}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record details of conversation or update..."
              className="mt-1 block w-full rounded border border-[#e0e2e6] bg-white p-2 text-xs text-[#181d26] placeholder:text-[#9297a0] focus:border-[#181d26] focus:outline-none"
            />
          </div>

          {error && <p className="text-[11px] text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded px-2.5 py-1 text-xs font-medium text-[#41454d] hover:text-[#181d26]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex items-center gap-1 rounded bg-[#181d26] px-3 py-1 text-xs font-medium text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Save Activity
            </button>
          </div>
        </form>
      )}

      {/* Timeline Stream */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="py-4 text-center text-xs text-[#9297a0]">
            No manual activities logged yet. Log notes, calls, or meeting minutes here.
          </p>
        ) : (
          activities.map((act) => {
            const Icon = TYPE_ICONS[act.type] || MessageSquare;
            const colorClass = TYPE_COLORS[act.type] || 'bg-[#fafbfc] text-[#333840]';

            return (
              <div key={act.id} className="group flex items-start gap-3 rounded-lg border border-[#f0f2f5] p-3 hover:bg-[#fafbfc] transition-colors">
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#181d26]">
                        {act.created_by?.name || 'Sales Staff'}
                      </span>
                      <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold border ${colorClass}`}>
                        {act.type}
                      </span>
                      {act.call_outcome && (
                        <span className="rounded bg-[#f0f2f5] px-1.5 py-0.2 text-[9px] font-medium text-[#333840] border border-[#e0e2e6]">
                          {act.call_outcome.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#9297a0] flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#333840] whitespace-pre-wrap">{act.content}</p>
                </div>
                {act.created_by_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleDelete(act.id)}
                    title="Delete activity"
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#9297a0] hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
