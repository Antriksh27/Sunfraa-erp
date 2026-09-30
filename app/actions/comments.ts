'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addProjectCommentAction(
  projectId: string,
  commentText: string,
  parentCommentId?: string,
  isPinned: boolean = false,
  mentionedUserIds: string[] = []
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!projectId || !commentText.trim()) {
    return { error: 'Comment text is required.' };
  }

  const { data: comment, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      author_id: user.id,
      comment_text: commentText.trim(),
      is_pinned: isPinned,
      mentioned_user_ids: mentionedUserIds,
      parent_comment_id: parentCommentId || null,
    })
    .select('id')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath(`/execution/${projectId}`);
  revalidatePath(`/design/${projectId}`);
  revalidatePath(`/liaisoning/${projectId}`);

  return { success: true, commentId: comment.id };
}

export async function togglePinCommentAction(
  commentId: string,
  projectId: string,
  isPinned: boolean
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('project_comments')
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath(`/execution/${projectId}`);
  revalidatePath(`/design/${projectId}`);
  revalidatePath(`/liaisoning/${projectId}`);

  return { success: true };
}

export async function deleteProjectCommentAction(commentId: string, projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('project_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath(`/execution/${projectId}`);
  revalidatePath(`/design/${projectId}`);
  revalidatePath(`/liaisoning/${projectId}`);

  return { success: true };
}
