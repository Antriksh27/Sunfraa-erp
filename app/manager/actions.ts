'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function reassignProjectOwnerAction(
  projectId: string,
  newOwnerId: string,
  reason: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'DIRECTOR') {
    return { error: 'Unauthorized. Only Director can reassign project ownership.' };
  }

  if (!projectId || !newOwnerId || !reason.trim()) {
    return { error: 'Project, new assignee, and mandatory reassignment reason are required.' };
  }

  // 1. Fetch current owner and new owner profiles
  const { data: project } = await supabase
    .from('projects')
    .select('lead_owner_id, client_name')
    .eq('id', projectId)
    .single();

  const { data: newOwnerProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', newOwnerId)
    .single();

  const { data: managerProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const prevOwnerId = project?.lead_owner_id || null;

  // 2. Update project lead_owner_id
  const { error: updateError } = await supabase
    .from('projects')
    .update({
      lead_owner_id: newOwnerId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Insert into reassignment_logs
  await supabase.from('reassignment_logs').insert({
    project_id: projectId,
    reassigned_from_id: prevOwnerId,
    reassigned_to_id: newOwnerId,
    reassignment_reason: reason.trim(),
    reassigned_by_id: user.id,
  });

  // 4. Log in lead_activities audit trail
  await supabase.from('lead_activities').insert({
    project_id: projectId,
    type: 'NOTE',
    content: `[MANAGER REASSIGNMENT] Assigned to ${newOwnerProfile?.name || 'Officer'} by ${managerProfile?.name || 'Manager'}. Reason: "${reason.trim()}"`,
    created_by_id: user.id,
  });

  revalidatePath('/manager');
  revalidatePath('/pipeline');
  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function batchReassignProjectsAction(
  projectIds: string[],
  newOwnerId: string,
  reason: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (callerProfile?.role !== 'DIRECTOR') {
    return { error: 'Unauthorized. Only Director can reassign project ownership.' };
  }

  if (!projectIds || projectIds.length === 0 || !newOwnerId || !reason.trim()) {
    return { error: 'Please select projects, a new assignee, and state the reason.' };
  }

  for (const pid of projectIds) {
    await reassignProjectOwnerAction(pid, newOwnerId, reason);
  }

  revalidatePath('/manager');
  revalidatePath('/pipeline');
  return { success: true, count: projectIds.length };
}
