'use client';

import { useState } from 'react';
import { ProjectComment, Profile } from '@/types/database';
import {
  addProjectCommentAction,
  togglePinCommentAction,
  deleteProjectCommentAction,
} from '@/app/actions/comments';
import {
  MessageSquare,
  Pin,
  Send,
  Reply,
  Trash2,
  AtSign,
  User,
  Loader2,
  Clock,
  PinOff,
} from 'lucide-react';

interface ProjectCommentsSectionProps {
  projectId: string;
  comments: (ProjectComment & { author?: Profile | null })[];
  teamMembers?: Profile[];
  currentUserId?: string;
  canEdit?: boolean;
}

export default function ProjectCommentsSection({
  projectId,
  comments,
  teamMembers = [],
  currentUserId,
  canEdit = true,
}: ProjectCommentsSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  // Group top-level comments and child replies
  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const repliesMap = new Map<string, (ProjectComment & { author?: Profile | null })[]>();
  comments.forEach((c) => {
    if (c.parent_comment_id) {
      const list = repliesMap.get(c.parent_comment_id) || [];
      list.push(c);
      repliesMap.set(c.parent_comment_id, list);
    }
  });

  // Pinned comments
  const pinnedComments = comments.filter((c) => c.is_pinned);

  // Detect @ mention trigger
  function handleTextChange(val: string) {
    setCommentText(val);
    if (val.endsWith('@')) {
      setShowMentionMenu(true);
    } else {
      setShowMentionMenu(false);
    }
  }

  function insertMention(memberName: string, memberId: string) {
    setCommentText((prev) => prev + memberName + ' ');
    setShowMentionMenu(false);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    // Extract mentioned users
    const mentionedIds = teamMembers
      .filter((m) => commentText.includes(`@${m.name}`) || commentText.includes(m.name))
      .map((m) => m.id);

    await addProjectCommentAction(projectId, commentText, undefined, isPinned, mentionedIds);
    setCommentText('');
    setIsPinned(false);
    setSubmitting(false);
  }

  async function handleAddReply(parentId: string) {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const mentionedIds = teamMembers
      .filter((m) => replyText.includes(`@${m.name}`) || replyText.includes(m.name))
      .map((m) => m.id);

    await addProjectCommentAction(projectId, replyText, parentId, false, mentionedIds);
    setReplyText('');
    setReplyToId(null);
    setSubmitting(false);
  }

  async function handleTogglePin(comment: ProjectComment) {
    await togglePinCommentAction(comment.id, projectId, !comment.is_pinned);
  }

  async function handleDelete(commentId: string) {
    await deleteProjectCommentAction(commentId, projectId);
  }

  return (
    <div className="rounded-lg border border-[#e0e2e6] bg-[#ffffff] p-5 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#f0f2f5] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#aa2d00]" />
          <h3 className="text-xs font-bold text-[#181d26] uppercase tracking-wider">
            Team Discussions & Threaded Notes ({comments.length})
          </h3>
        </div>
        {pinnedComments.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Pin className="h-3 w-3 text-amber-600" />
            {pinnedComments.length} Pinned
          </span>
        )}
      </div>

      {/* Pinned Highlights Box */}
      {pinnedComments.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
            <Pin className="h-3 w-3 text-amber-600" />
            Pinned Notes & Strategic Directives
          </span>
          {pinnedComments.map((pc) => (
            <div key={pc.id} className="rounded bg-white p-2.5 border border-amber-200 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-[#5f6570]">
                <strong className="text-[#181d26]">{pc.author?.name || 'Team Lead'}</strong>
                <span>{new Date(pc.created_at).toLocaleString()}</span>
              </div>
              <p className="text-xs text-[#181d26] font-medium">{pc.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main Comment Input Form */}
      {canEdit && (
        <form onSubmit={handleAddComment} className="relative rounded-lg bg-[#fafbfc] p-3 border border-[#e0e2e6] space-y-2 text-xs">
          <div className="relative">
            <textarea
              rows={2}
              required
              value={commentText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Leave a team note... (Type @ to mention an engineer or officer)"
              className="block w-full rounded border border-[#e0e2e6] bg-white p-2 text-xs text-[#181d26] focus:border-[#181d26]"
            />

            {/* Quick Mention Popup */}
            {showMentionMenu && (
              <div className="absolute left-2 bottom-full mb-1 z-20 w-56 rounded-lg bg-white p-1 shadow-xl border border-[#e0e2e6] max-h-40 overflow-y-auto">
                <span className="px-2 py-1 text-[10px] font-bold text-[#5f6570] block border-b border-[#f0f2f5]">
                  Select Team Member:
                </span>
                {teamMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => insertMention(m.name, m.id)}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-[#fafbfc] rounded flex justify-between items-center"
                  >
                    <span className="font-semibold text-[#181d26]">@{m.name}</span>
                    <span className="text-[10px] text-[#5f6570]">{m.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-[11px] text-[#5f6570] cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#e0e2e6] text-[#181d26]"
              />
              <span className="flex items-center gap-1">
                <Pin className="h-3 w-3 text-amber-600" />
                Pin to top
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="flex items-center gap-1 rounded bg-[#181d26] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0d1218] disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Post Note
            </button>
          </div>
        </form>
      )}

      {/* Threaded Comments List */}
      <div className="space-y-3">
        {topLevelComments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e0e2e6] bg-[#fafbfc] p-8 text-center text-xs text-[#5f6570]">
            <MessageSquare className="mx-auto h-7 w-7 text-[#d0d4dc] mb-2" />
            <p className="font-semibold text-[#181d26]">No Project Notes Yet</p>
            <p className="text-[11px] text-[#5f6570] mt-0.5">
              {canEdit ? 'Post updates, tag team members (@name), or record client conversations using the composer above.' : 'No notes or discussions have been posted on this project yet.'}
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = repliesMap.get(comment.id) || [];
            const isAuthor = currentUserId === comment.author_id;

            return (
              <div key={comment.id} className="rounded-lg border border-[#e0e2e6] bg-[#fafbfc] p-3.5 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e0e2e6] text-[#181d26] font-bold text-[10px]">
                      {comment.author?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <span className="font-bold text-[#181d26]">{comment.author?.name || 'Team Member'}</span>
                      <span className="text-[10px] text-[#5f6570] ml-2">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(comment)}
                      title={comment.is_pinned ? 'Unpin comment' : 'Pin comment'}
                      className={`p-1 rounded hover:bg-[#e0e2e6] ${comment.is_pinned ? 'text-amber-600' : 'text-[#9297a0]'}`}
                    >
                      {comment.is_pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    {(isAuthor || canEdit) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="p-1 text-[#9297a0] hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#181d26] whitespace-pre-wrap">{comment.comment_text}</p>

                {/* Reply Button / Action */}
                <div className="pt-1 flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="flex items-center gap-1 font-semibold text-[#aa2d00] hover:underline"
                  >
                    <Reply className="h-3 w-3" />
                    Reply {replies.length > 0 && `(${replies.length})`}
                  </button>
                </div>

                {/* Inline Reply Form */}
                {replyToId === comment.id && (
                  <div className="mt-2 flex gap-2 pt-2 border-t border-[#e0e2e6]">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="h-7 flex-1 rounded border border-[#e0e2e6] bg-white px-2 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={submitting || !replyText.trim()}
                      className="rounded bg-[#181d26] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#0d1218]"
                    >
                      Reply
                    </button>
                  </div>
                )}

                {/* Nested Thread Replies */}
                {replies.length > 0 && (
                  <div className="mt-2 space-y-2 pl-4 border-l-2 border-[#fcab79]">
                    {replies.map((reply) => (
                      <div key={reply.id} className="rounded bg-white p-2 border border-[#f0f2f5] space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-[#5f6570]">
                          <strong className="text-[#181d26]">{reply.author?.name || 'Officer'}</strong>
                          <span>{new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-[#181d26]">{reply.comment_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
