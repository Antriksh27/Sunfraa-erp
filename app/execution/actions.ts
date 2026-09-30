'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ExecutionStage, CompletionCaptureMethod, SubcontractorTrade, SubcontractorRateType } from '@/types/database';

const ORDERED_STAGES: ExecutionStage[] = [
  'STRUCTURE_FABRICATION',
  'PANEL',
  'WIRING',
  'CIVIL',
];

export async function createSubcontractorAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const name = (formData.get('name') as string)?.trim();
  const trade = formData.get('trade') as SubcontractorTrade;
  const phone = (formData.get('phone') as string)?.trim();
  const rateType = formData.get('rateType') as SubcontractorRateType;
  const defaultRate = parseFloat(formData.get('defaultRate') as string) || 0;

  if (!name || !trade || !phone || !rateType) {
    return { error: 'Please fill in all subcontractor details.' };
  }

  const { data, error } = await supabase
    .from('subcontractors')
    .insert({
      name,
      trade,
      phone,
      rate_type: rateType,
      default_rate: defaultRate,
      is_active: true,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/execution');
  return { success: true, subcontractor: data };
}

export async function updateSubcontractorAction(id: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const name = (formData.get('name') as string)?.trim();
  const trade = formData.get('trade') as SubcontractorTrade;
  const phone = (formData.get('phone') as string)?.trim();
  const rateType = formData.get('rateType') as SubcontractorRateType;
  const defaultRate = parseFloat(formData.get('defaultRate') as string) || 0;
  const isActive = formData.get('isActive') === 'true';

  const { error } = await supabase
    .from('subcontractors')
    .update({
      name,
      trade,
      phone,
      rate_type: rateType,
      default_rate: defaultRate,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/execution');
  return { success: true };
}

export async function toggleSubcontractorActiveAction(id: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from('subcontractors')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/execution');
  return { success: true };
}

export async function assignLabourAction(
  projectId: string,
  stage: ExecutionStage,
  assignedDate: string,
  labourTeamId?: string,
  subcontractorId?: string,
  headcount: number = 4,
  notes?: string,
  rate?: number,
  totalCost?: number
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!stage || !assignedDate) {
    return { error: 'Stage and assignment date are required.' };
  }

  // Gate: Block labour assignment if the project's BOM has not been approved yet
  const { data: bom } = await supabase
    .from('boms')
    .select('id, approved_at')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!bom || !bom.approved_at) {
    return {
      error: 'BOM must be approved by the Head Engineer before labour can be assigned.',
    };
  }

  // Determine whether this is a labour team or subcontractor assignment
  const hasTeam = Boolean(labourTeamId && labourTeamId.trim() && labourTeamId !== '00000000-0000-0000-0000-000000000000');
  const hasSubcontractor = Boolean(subcontractorId && subcontractorId.trim());

  let finalTeamId: string | null = null;
  let finalSubcontractorId: string | null = null;

  if (hasSubcontractor) {
    finalSubcontractorId = subcontractorId!;
    finalTeamId = null;
  } else if (hasTeam) {
    finalTeamId = labourTeamId!;
  } else {
    // Fallback: assign first available in-house labour team
    const { data: firstTeam } = await supabase.from('labour_teams').select('id').limit(1).maybeSingle();
    finalTeamId = firstTeam?.id || null;
  }

  const { error } = await supabase.from('labour_assignments').insert({
    project_id: projectId,
    labour_team_id: finalTeamId,
    subcontractor_id: finalSubcontractorId,
    stage,
    assigned_date: assignedDate,
    headcount,
    notes: notes || null,
    rate: rate || null,
    total_cost: totalCost || null,
  });

  if (error) {
    if (error.code === '23505' || error.message.includes('unique') || error.message.includes('labour_assignment_unique_team_date')) {
      return {
        error: `Schedule Conflict (Business Rule 7): This team/subcontractor is already deployed on ${assignedDate}. Please choose another date.`,
      };
    }
    return { error: error.message };
  }

  revalidatePath(`/execution/${projectId}`);
  revalidatePath('/execution');
  return { success: true };
}

export async function completeStageProgressAction(
  projectId: string,
  stage: ExecutionStage,
  photoUrls: string[],
  comment: string,
  customClient?: any
) {
  const supabase = customClient || createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!photoUrls || photoUrls.length === 0 || !photoUrls[0]) {
    return { error: 'At least one installation verification photo is required for stage sign-off.' };
  }

  // 1. Fetch already completed stages for this project (Business Rule 8: Sequential Stage Order)
  const { data: existingProgress } = await supabase
    .from('execution_stage_progress')
    .select('stage')
    .eq('project_id', projectId);

  const completedStages = new Set((existingProgress as { stage: string }[] | null)?.map((p) => p.stage) || []);
  const currentIndex = ORDERED_STAGES.indexOf(stage);

  // Verify all previous stages are completed
  for (let i = 0; i < currentIndex; i++) {
    const prevStage = ORDERED_STAGES[i];
    if (!completedStages.has(prevStage)) {
      return {
        error: `Sequential Stage Order Violation (Business Rule 8): You must complete "${prevStage.replace('_', ' ')}" before signing off "${stage.replace('_', ' ')}".`,
      };
    }
  }

  const now = new Date().toISOString();

  // 2. Insert progress record
  const { error } = await supabase.from('execution_stage_progress').insert({
    project_id: projectId,
    stage,
    photo_url: photoUrls[0],
    photo_urls: photoUrls,
    comment: comment || null,
    completed_at: now,
    completed_by_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  // If this was the first stage, advance project stage to EXECUTION_IN_PROGRESS
  if (stage === 'STRUCTURE_FABRICATION') {
    await supabase
      .from('projects')
      .update({ stage: 'EXECUTION_IN_PROGRESS', updated_at: now })
      .eq('id', projectId)
      .eq('stage', 'DIRECTOR_APPROVED');
  }

  // When WIRING stage is signed off, trigger trg_on_execution_wiring_stage_completed handles
  // atomic stage transition to CEI_IN_PROGRESS / LIAISONING_IN_PROGRESS in Postgres.
  if (stage === 'WIRING') {
    try {
      revalidatePath('/liaisoning');
      revalidatePath('/design');
    } catch {}
  }

  try {
    revalidatePath(`/execution/${projectId}`);
    revalidatePath('/execution');
    revalidatePath('/execution-overview');
  } catch {}
  return { success: true };
}

export async function submitExecutionCompletionAction(
  projectId: string,
  formData: FormData,
  customClient?: any
) {
  const supabase = customClient || createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  // Verify that all 4 stages are completed
  const { data: existingProgress } = await supabase
    .from('execution_stage_progress')
    .select('stage')
    .eq('project_id', projectId);

  const completedStages = new Set((existingProgress as { stage: string }[] | null)?.map((p) => p.stage) || []);

  for (const s of ORDERED_STAGES) {
    if (!completedStages.has(s)) {
      return {
        error: `Incomplete Stages: All 4 execution stages must have verified sign-offs before project completion. Missing: ${s.replace('_', ' ')}.`,
      };
    }
  }

  const panelCount = parseInt(formData.get('panelCount') as string, 10);
  const inverterSerialNumber = formData.get('inverterSerialNumber') as string;
  const capturedVia = formData.get('capturedVia') as CompletionCaptureMethod;
  const serialsRaw = formData.get('panelSerialNumbers') as string;

  const panelSerialNumbers = serialsRaw
    ? serialsRaw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  if (isNaN(panelCount) || panelCount <= 0 || !inverterSerialNumber || !capturedVia) {
    return { error: 'Please provide Panel Count, Inverter Serial Number, and Capture Method.' };
  }

  if (panelSerialNumbers.length === 0) {
    return { error: 'Please enter at least one panel serial number.' };
  }

  const now = new Date().toISOString();

  // Insert execution completion dossier record (strictly informational/record-keeping for site handover)
  const { error } = await supabase.from('execution_completions').insert({
    project_id: projectId,
    panel_serial_numbers: panelSerialNumbers,
    panel_count: panelCount,
    inverter_serial_number: inverterSerialNumber,
    captured_via: capturedVia,
    completed_at: now,
  });

  if (error) {
    return { error: error.message };
  }

  try {
    revalidatePath('/execution');
    revalidatePath(`/execution/${projectId}`);
    revalidatePath('/execution-overview');
    revalidatePath('/liaisoning');
    revalidatePath('/design');
  } catch {}

  return { success: true };
}

export async function approveBOMAction(bomId: string, projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'HEAD_ENGINEER' && profile?.role !== 'DIRECTOR') {
    return { error: 'Unauthorized: Only HEAD_ENGINEER or DIRECTOR can approve BOMs.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('boms')
    .update({
      approved_at: now,
      approved_by_id: user.id,
    })
    .eq('id', bomId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/store');
  revalidatePath('/execution-overview');
  revalidatePath(`/execution/${projectId}`);
  return { success: true };
}

