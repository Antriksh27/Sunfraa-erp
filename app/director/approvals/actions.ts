'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DirectorRejectionReason } from '@/types/database';

export async function approveProjectWithMarginAction(projectId: string, estimatedMargin?: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'DIRECTOR') {
    return { error: 'Forbidden (Business Rule 5): Only DIRECTOR can approve projects for site execution.' };
  }

  const now = new Date().toISOString();

  // 1. Update Project
  const { error: projError } = await supabase
    .from('projects')
    .update({
      director_approved_at: now,
      director_approved_by_id: user.id,
      stage: 'DIRECTOR_APPROVED',
      updated_at: now,
    })
    .eq('id', projectId);

  if (projError) {
    return { error: projError.message };
  }

  // 2. Insert Audit Log
  await supabase.from('approval_audit_logs').insert({
    project_id: projectId,
    action: 'APPROVED',
    actor_id: user.id,
    estimated_margin: estimatedMargin || null,
  });

  revalidatePath('/director/approvals');
  revalidatePath('/execution');
  revalidatePath('/store');
  revalidatePath(`/pipeline/${projectId}`);

  return { success: true };
}

export async function rejectProjectAction(
  projectId: string,
  reason: DirectorRejectionReason,
  notes?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'DIRECTOR') {
    return { error: 'Forbidden: Only DIRECTOR can reject projects.' };
  }

  const now = new Date().toISOString();

  // 1. Revert stage to QUOTATION_SENT so Sales & Accounts can revise
  const { error: projError } = await supabase
    .from('projects')
    .update({
      stage: 'QUOTATION_SENT',
      last_rejected_reason: reason,
      last_rejected_notes: notes || null,
      last_rejected_at: now,
      updated_at: now,
    })
    .eq('id', projectId);

  if (projError) {
    return { error: projError.message };
  }

  // 2. Insert Audit Log
  await supabase.from('approval_audit_logs').insert({
    project_id: projectId,
    action: 'REJECTED',
    actor_id: user.id,
    reason,
    notes: notes || null,
  });

  revalidatePath('/director/approvals');
  revalidatePath('/pipeline');
  revalidatePath('/accounts');
  revalidatePath(`/pipeline/${projectId}`);

  return { success: true };
}

export async function batchApproveProjectsAction(projectIds: string[]) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'DIRECTOR') {
    return { error: 'Forbidden (Business Rule 5): Only DIRECTOR can approve projects.' };
  }

  if (!projectIds || projectIds.length === 0) {
    return { error: 'No projects selected for batch approval.' };
  }

  const now = new Date().toISOString();

  // 1. Bulk Update Projects
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      director_approved_at: now,
      director_approved_by_id: user.id,
      stage: 'DIRECTOR_APPROVED',
      updated_at: now,
    })
    .in('id', projectIds);

  if (updateError) {
    return { error: updateError.message };
  }

  // 2. Bulk Insert Audit Logs
  const auditEntries = projectIds.map((pid) => ({
    project_id: pid,
    action: 'APPROVED' as const,
    actor_id: user.id,
    notes: 'Batch Approved via Director Approval Queue',
  }));

  await supabase.from('approval_audit_logs').insert(auditEntries);

  revalidatePath('/director/approvals');
  revalidatePath('/execution');
  revalidatePath('/store');

  return { success: true, count: projectIds.length };
}
