'use client';

import { ProjectComment, LeadActivity, ReassignmentLog, DesignFile, PaymentMilestone } from '@/types/database';
import {
  MessageSquare,
  PhoneCall,
  Calendar,
  FileText,
  UserCheck,
  CreditCard,
  History,
  CheckCircle2,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: 'COMMENT' | 'ACTIVITY' | 'REASSIGNMENT' | 'DESIGN' | 'PAYMENT';
  title: string;
  description: string;
  authorName?: string;
  timestamp: string;
}

interface ConsolidatedActivityTimelineProps {
  comments?: ProjectComment[];
  activities?: LeadActivity[];
  reassignments?: ReassignmentLog[];
  designFiles?: DesignFile[];
  payments?: PaymentMilestone[];
}

export default function ConsolidatedActivityTimeline({
  comments = [],
  activities = [],
  reassignments = [],
  designFiles = [],
  payments = [],
}: ConsolidatedActivityTimelineProps) {
  const events: TimelineEvent[] = [];

  // 1. Comments
  comments.forEach((c) => {
    events.push({
      id: `comment-${c.id}`,
      type: 'COMMENT',
      title: `${c.author?.name || 'Team Member'} commented`,
      description: c.comment_text,
      authorName: c.author?.name || 'Officer',
      timestamp: c.created_at,
    });
  });

  // 2. Lead activities
  activities.forEach((a) => {
    events.push({
      id: `activity-${a.id}`,
      type: 'ACTIVITY',
      title: `${a.type} Logged`,
      description: a.content,
      authorName: a.created_by?.name || 'Sales Officer',
      timestamp: a.created_at,
    });
  });

  // 3. Reassignments
  reassignments.forEach((r) => {
    events.push({
      id: `reassign-${r.id}`,
      type: 'REASSIGNMENT',
      title: `Ownership Reassigned`,
      description: `Reassigned from ${r.reassigned_from?.name || 'Prior Owner'} to ${r.reassigned_to?.name || 'New Assignee'}. Reason: "${r.reassignment_reason}"`,
      authorName: r.reassigned_by?.name || 'Manager',
      timestamp: r.created_at,
    });
  });

  // 4. Design CAD files
  designFiles.forEach((df) => {
    events.push({
      id: `design-${df.id}`,
      type: 'DESIGN',
      title: `CAD / CEI Drawing Uploaded (v${df.version || 1})`,
      description: `${df.type.replace(/_/g, ' ')} Drawing - ${df.version_notes || 'Uploaded'}`,
      authorName: df.uploaded_by?.name || 'Design Engineer',
      timestamp: df.uploaded_at,
    });
  });

  // 5. Payments
  payments.forEach((p) => {
    if (p.collected_at) {
      events.push({
        id: `payment-${p.id}`,
        type: 'PAYMENT',
        title: `Payment Milestone Collected: ${p.milestone_name}`,
        description: `₹${Number(p.amount).toLocaleString('en-IN')} received via ${p.payment_mode || 'Bank'} (Ref: ${p.reference_number || 'N/A'})`,
        authorName: p.collected_by?.name || 'Accounts Officer',
        timestamp: p.collected_at,
      });
    }
  });

  // Sort chronologically descending
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'COMMENT':
        return <MessageSquare className="h-3.5 w-3.5 text-[#aa2d00]" />;
      case 'ACTIVITY':
        return <PhoneCall className="h-3.5 w-3.5 text-amber-600" />;
      case 'REASSIGNMENT':
        return <UserCheck className="h-3.5 w-3.5 text-purple-600" />;
      case 'DESIGN':
        return <FileText className="h-3.5 w-3.5 text-cyan-600" />;
      case 'PAYMENT':
        return <CreditCard className="h-3.5 w-3.5 text-[#16a34a]" />;
      default:
        return <History className="h-3.5 w-3.5 text-[#5f6570]" />;
    }
  };

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 border-b border-[#f0f2f5] pb-3">
        <History className="h-4 w-4 text-[#181d26]" />
        <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
          Consolidated Project Audit Trail & Activity Feed ({events.length})
        </h3>
      </div>

      {events.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#9297a0]">
          No operational activity recorded for this project yet.
        </p>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#e0e2e6]">
          {events.map((ev) => (
            <div key={ev.id} className="relative text-xs space-y-1">
              {/* Event Marker */}
              <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white border border-[#e0e2e6] shadow-2xs">
                {getEventIcon(ev.type)}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-[#181d26]">{ev.title}</span>
                <span className="text-[10px] text-[#5f6570]">
                  {new Date(ev.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-[#5f6570]">{ev.description}</p>
              {ev.authorName && (
                <span className="text-[10px] text-[#9297a0]">By: {ev.authorName}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
