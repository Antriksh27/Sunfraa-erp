'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { DesignFileType, ProjectStage, DesignSystemType, DesignReviewStatus } from '@/types/database';

export async function uploadDesignFileAction(
  projectId: string,
  type: DesignFileType,
  fileUrl: string,
  versionNotes?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!projectId || !type || !fileUrl) {
    return { error: 'Project, drawing type, and file URL are required.' };
  }

  // 1. Calculate next version for this project and file type
  const { data: existingFiles } = await supabase
    .from('design_files')
    .select('version')
    .eq('project_id', projectId)
    .eq('type', type)
    .order('version', { ascending: false })
    .limit(1);

  const currentMaxVersion = existingFiles && existingFiles.length > 0 ? existingFiles[0].version : 0;
  const nextVersion = currentMaxVersion + 1;

  const now = new Date().toISOString();

  // 2. Insert new design file version
  const { error: insertError } = await supabase.from('design_files').insert({
    project_id: projectId,
    type,
    file_url: fileUrl,
    version: nextVersion,
    version_notes: versionNotes || null,
    status: 'APPROVED',
    uploaded_by_id: user.id,
    uploaded_at: now,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  // 3. If Initial Design, advance project stage to DESIGN_UPLOADED and auto-populate BOM with real line items
  if (type === 'INITIAL') {
    await supabase
      .from('projects')
      .update({
        stage: 'DESIGN_UPLOADED' as ProjectStage,
        updated_at: now,
      })
      .eq('id', projectId)
      .in('stage', ['SITE_SURVEY_DONE', 'DESIGN_PENDING']);

    // Fetch project info
    const { data: project } = await supabase
      .from('projects')
      .select('id, kw_required, category, client_name')
      .eq('id', projectId)
      .single();

    // Fetch SLD specifications if configured
    const { data: sld } = await supabase
      .from('sld_specifications')
      .select('*')
      .eq('project_id', projectId)
      .maybeSingle();

    // Ensure BOM exists
    let bomId: string | null = null;
    const { data: existingBom } = await supabase
      .from('boms')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    if (existingBom) {
      bomId = existingBom.id;
    } else {
      const { data: newBom } = await supabase
        .from('boms')
        .insert({
          project_id: projectId,
          created_by_id: user.id,
        })
        .select('id')
        .single();
      if (newBom) bomId = newBom.id;
    }

    if (bomId) {
      // Check if BOM items already exist
      const { count: itemCount } = await supabase
        .from('bom_items')
        .select('id', { count: 'exact', head: true })
        .eq('bom_id', bomId);

      if (!itemCount || itemCount === 0) {
        const systemKw = Number(project?.kw_required) || 5;
        const panelCount = sld?.panel_count || Math.ceil((systemKw * 1000) / 550);
        const inverterKw = sld?.inverter_kw || systemKw;
        const dcCableMtr = sld?.dc_cable_length_m || Math.round(systemKw * 15);
        const acCableMtr = sld?.ac_cable_length_m || Math.round(systemKw * 10);

        const initialItems = [
          {
            bom_id: bomId,
            item_name: `Mono PERC Solar PV Modules 550W (${panelCount} Panels)`,
            category: 'PANEL',
            quantity: panelCount,
            unit: 'NOS',
          },
          {
            bom_id: bomId,
            item_name: `Solar Grid-Tied Inverter ${inverterKw} kW`,
            category: 'INVERTER',
            quantity: 1,
            unit: 'NOS',
          },
          {
            bom_id: bomId,
            item_name: `GI Elevated Solar Mounting Structure (${systemKw} kW System)`,
            category: 'STRUCTURE',
            quantity: systemKw,
            unit: 'SET',
          },
          {
            bom_id: bomId,
            item_name: '4 sq.mm 1C Copper Solar DC Cable UV Resistant',
            category: 'CABLE',
            quantity: dcCableMtr,
            unit: 'MTR',
          },
          {
            bom_id: bomId,
            item_name: '4-Core Copper Armoured AC Cable',
            category: 'CABLE',
            quantity: acCableMtr,
            unit: 'MTR',
          },
          {
            bom_id: bomId,
            item_name: 'DCDB & ACDB Distribution Boxes with SPD & MCBs',
            category: 'BOS',
            quantity: 1,
            unit: 'SET',
          },
          {
            bom_id: bomId,
            item_name: 'Chemical Earthing Kit & Lightning Arrestor (LA)',
            category: 'BOS',
            quantity: 1,
            unit: 'SET',
          },
        ];

        await supabase.from('bom_items').insert(initialItems);
      }
    }
  }

  revalidatePath('/design');
  revalidatePath(`/design/${projectId}`);
  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath(`/liaisoning/${projectId}`);

  return { success: true, version: nextVersion };
}

export async function saveCEIChecklistAction(
  projectId: string,
  checklist: {
    earthingPit: boolean;
    lightningArrestor: boolean;
    transformerHt: boolean;
    feeChallan: boolean;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('cei_checklists').upsert(
    {
      project_id: projectId,
      earthing_pit_verified: checklist.earthingPit,
      lightning_arrestor_verified: checklist.lightningArrestor,
      transformer_ht_attached: checklist.transformerHt,
      cei_fee_challan_attached: checklist.feeChallan,
      verified_by_id: user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'project_id' }
  );

  if (error) return { error: error.message };

  revalidatePath(`/design/${projectId}`);
  revalidatePath('/design');
  return { success: true };
}

export async function saveSLDSpecificationAction(
  projectId: string,
  spec: {
    systemType: DesignSystemType;
    inverterKw: number;
    panelCount: number;
    stringCount: number;
    dcCableLengthM: number;
    acCableLengthM: number;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('sld_specifications').upsert(
    {
      project_id: projectId,
      system_type: spec.systemType,
      inverter_kw: spec.inverterKw,
      panel_count: spec.panelCount,
      string_count: spec.stringCount,
      dc_cable_length_m: spec.dcCableLengthM,
      ac_cable_length_m: spec.acCableLengthM,
      created_by_id: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'project_id' }
  );

  if (error) return { error: error.message };

  revalidatePath(`/design/${projectId}`);
  revalidatePath('/design');
  return { success: true };
}

export async function flagDesignRevisionAction(
  designFileId: string,
  projectId: string,
  comments: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('design_files')
    .update({
      status: 'NEEDS_REVISION',
      revision_comments: comments,
    })
    .eq('id', designFileId);

  if (error) return { error: error.message };

  revalidatePath('/design');
  revalidatePath(`/design/${projectId}`);
  return { success: true };
}
