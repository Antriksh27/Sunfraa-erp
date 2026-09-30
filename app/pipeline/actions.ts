'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  ProjectCategory,
  ProjectStage,
  LeadSource,
  LeadTemperature,
  LeadLostReason,
  LeadActivityType,
  QuotationLineItem,
  QuotationStatus,
} from '@/types/database';
import { getProjectUrlForRole } from '@/lib/navigation';

const RESIDENTIAL_DOCS = [
  'Latest Electricity Bill (Last 3 Months)',
  'Aadhaar Card of Property Owner',
  'Property Ownership Proof / Tax Receipt',
  'Roof Photo & Access Layout',
];

const COMMERCIAL_DOCS = [
  'Latest High Tension / Commercial Electricity Bill',
  'Company GST Certificate',
  'Company PAN Card & Director ID Proof',
  'Property Ownership Proof / Sanctioned Building Plan',
  'Roof Structural Stability Certificate',
  'Transformer Capacity & Sanctioned Load Document',
];

export async function checkDuplicateLeadAction(phone: string, address: string) {
  const supabase = createClient();
  const trimmedPhone = phone?.trim();
  const trimmedAddr = address?.trim();

  let query = supabase.from('projects').select('id, client_name, phone, address, stage, created_at');

  if (trimmedPhone && trimmedAddr && trimmedAddr.length > 3) {
    query = query.or(`phone.eq.${trimmedPhone},address.ilike.%${trimmedAddr}%`);
  } else if (trimmedPhone) {
    query = query.eq('phone', trimmedPhone);
  } else if (trimmedAddr && trimmedAddr.length > 3) {
    query = query.ilike('address', `%${trimmedAddr}%`);
  } else {
    return { duplicates: [] };
  }

  const { data } = await query.limit(5);
  return { duplicates: data || [] };
}

export async function createLeadAction(formData: FormData) {
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

  const clientName = formData.get('clientName') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const category = formData.get('category') as ProjectCategory;
  const kwRequired = parseFloat(formData.get('kwRequired') as string);
  const sanctionedLoad = (formData.get('sanctionedLoad') as string) || null;
  const connectionNumber = (formData.get('connectionNumber') as string) || null;

  // New fields from Prompt 5
  const leadSource = (formData.get('leadSource') as LeadSource) || 'REFERRAL';
  const sourceDetail = (formData.get('sourceDetail') as string) || null;
  const temperature = (formData.get('temperature') as LeadTemperature) || 'WARM';
  const expectedCloseDate = (formData.get('expectedCloseDate') as string) || null;
  
  // Sales defaults to themselves; Director can assign or self-own
  const leadOwnerId =
    profile?.role === 'DIRECTOR'
      ? (formData.get('leadOwnerId') as string) || user.id
      : user.id;

  if (!clientName || !address || !phone || !category || isNaN(kwRequired) || kwRequired <= 0) {
    return { error: 'Please fill in all required fields (Client Name, Address, Phone, Category, kW Required).' };
  }

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      client_name: clientName,
      address,
      phone,
      category,
      kw_required: kwRequired,
      sanctioned_load: sanctionedLoad,
      connection_number: connectionNumber,
      lead_owner_id: leadOwnerId,
      stage: 'LEAD' as ProjectStage,
      lead_source: leadSource,
      source_detail: sourceDetail,
      temperature: temperature,
      expected_close_date: expectedCloseDate,
    })
    .select('id, category')
    .single();

  if (error || !project) {
    return { error: error?.message || 'Failed to create project.' };
  }

  // Seed default document checklist based on category
  const defaultDocs =
    category === 'COMMERCIAL' || category === 'INDUSTRIAL'
      ? COMMERCIAL_DOCS
      : RESIDENTIAL_DOCS;

  const docRows = defaultDocs.map((docName) => ({
    project_id: project.id,
    document_name: docName,
    required: true,
    uploaded: false,
  }));

  await supabase.from('document_checklist_items').insert(docRows);

  revalidatePath('/pipeline');
  redirect(`/pipeline/${project.id}`);
}

export async function updateLeadMetadataAction(projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const clientName = formData.get('clientName') as string;
  const address = formData.get('address') as string;
  const phone = formData.get('phone') as string;
  const category = formData.get('category') as ProjectCategory;
  const kwRequired = parseFloat(formData.get('kwRequired') as string);
  const sanctionedLoad = (formData.get('sanctionedLoad') as string) || null;
  const connectionNumber = (formData.get('connectionNumber') as string) || null;

  const leadSource = (formData.get('leadSource') as LeadSource) || 'REFERRAL';
  const sourceDetail = (formData.get('sourceDetail') as string) || null;
  const temperature = (formData.get('temperature') as LeadTemperature) || 'WARM';
  const expectedCloseDate = (formData.get('expectedCloseDate') as string) || null;

  if (!clientName || !address || !phone || !category || isNaN(kwRequired) || kwRequired <= 0) {
    return { error: 'Please fill in all required fields.' };
  }

  const { error } = await supabase
    .from('projects')
    .update({
      client_name: clientName,
      address,
      phone,
      category,
      kw_required: kwRequired,
      sanctioned_load: sanctionedLoad,
      connection_number: connectionNumber,
      lead_source: leadSource,
      source_detail: sourceDetail,
      temperature: temperature,
      expected_close_date: expectedCloseDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  return { success: true };
}

export async function scheduleSurveyAction(
  projectId: string,
  scheduledDate?: string,
  assignedEngineerId?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const updateData: Record<string, any> = {
    stage: 'SITE_SURVEY_SCHEDULED' as ProjectStage,
    updated_at: new Date().toISOString(),
  };

  if (scheduledDate) {
    updateData.survey_scheduled_date = scheduledDate;
  }
  if (assignedEngineerId) {
    updateData.survey_assigned_engineer_id = assignedEngineerId;
  }

  const { error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }

  // Also log activity to timeline
  let engineerName = 'Site Execution Team';
  if (assignedEngineerId) {
    const { data: eng } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', assignedEngineerId)
      .single();
    if (eng?.name) engineerName = eng.name;
  }

  const dateStr = scheduledDate ? new Date(scheduledDate).toLocaleDateString() : 'upcoming date';
  await supabase.from('lead_activities').insert({
    project_id: projectId,
    type: 'NOTE',
    content: `📅 Site survey scheduled for ${dateStr}, assigned to engineer ${engineerName}.`,
    created_by_id: user.id,
  });

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  return { success: true };
}

export async function submitSiteSurveyAction(projectId: string, formData: FormData) {
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

  if (profile?.role !== 'SITE_EXECUTION' && profile?.role !== 'DIRECTOR') {
    return {
      error: 'Forbidden: Only Site Execution engineers and Directors can submit site surveys. Sales coordination does not have write permissions on surveys.',
    };
  }

  const noOfPanels = parseInt(formData.get('noOfPanels') as string, 10);
  const physicalMeasurement = formData.get('physicalMeasurement') as string;
  const gpsLocation = formData.get('gpsLocation') as string;
  const contactedPerson = formData.get('contactedPerson') as string;
  const sanctionedLoad = formData.get('sanctionedLoad') as string;
  const connectionNumber = formData.get('connectionNumber') as string;
  const photoUrlsRaw = formData.get('photoUrls') as string;
  const diagramUrlsRaw = formData.get('diagramUrls') as string;

  let photoUrls: string[] = [];
  try {
    photoUrls = photoUrlsRaw ? JSON.parse(photoUrlsRaw) : [];
  } catch {
    photoUrls = [];
  }

  let diagramUrls: string[] = [];
  try {
    diagramUrls = diagramUrlsRaw ? JSON.parse(diagramUrlsRaw) : [];
  } catch {
    diagramUrls = [];
  }

  if (isNaN(noOfPanels) || noOfPanels <= 0 || !physicalMeasurement || !gpsLocation || !contactedPerson) {
    return { error: 'Please fill in all survey details (Panels, Measurements, GPS, and Contact Person).' };
  }

  if (photoUrls.length === 0) {
    return { error: 'At least 1 site survey photo is required (Section 4).' };
  }

  const { data: project } = await supabase
    .from('projects')
    .select('sanctioned_load, connection_number')
    .eq('id', projectId)
    .single();

  const finalSanctionedLoad = sanctionedLoad?.trim() || project?.sanctioned_load;
  const finalConnectionNumber = connectionNumber?.trim() || project?.connection_number;

  if (!finalSanctionedLoad || !finalConnectionNumber) {
    return {
      error:
        'Validation Failed (Business Rule 3): Sanctioned Load and Connection Number must be provided before completing Site Survey.',
    };
  }

  const { error: surveyError } = await supabase
    .from('site_surveys')
    .upsert({
      project_id: projectId,
      no_of_panels: noOfPanels,
      physical_measurement: physicalMeasurement,
      photo_urls: photoUrls,
      diagram_urls: diagramUrls,
      gps_location: gpsLocation,
      contacted_person: contactedPerson,
      surveyed_by_id: user.id,
      surveyed_at: new Date().toISOString(),
    }, { onConflict: 'project_id' });

  if (surveyError) {
    return { error: surveyError.message };
  }

  const { error: projectError } = await supabase
    .from('projects')
    .update({
      sanctioned_load: finalSanctionedLoad,
      connection_number: finalConnectionNumber,
      stage: 'SITE_SURVEY_DONE' as ProjectStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (projectError) {
    return { error: projectError.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  revalidatePath('/design');
  revalidatePath('/execution');
  revalidatePath(`/execution/${projectId}`);
  redirect(getProjectUrlForRole(projectId, profile?.role));
}

export async function saveQuotationVersionAction(
  projectId: string,
  lineItems: QuotationLineItem[],
  status: QuotationStatus = 'SENT'
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!lineItems || lineItems.length === 0) {
    return { error: 'Quotation must have at least one line item.' };
  }

  const totalAmount = lineItems.reduce((acc, item) => acc + (Number(item.amount) || (Number(item.qty) * Number(item.rate)) || 0), 0);
  if (totalAmount <= 0) {
    return { error: 'Total quotation amount must be greater than 0.' };
  }

  const { data: latestQuote } = await supabase
    .from('quotations')
    .select('version')
    .eq('project_id', projectId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestQuote?.version || 0) + 1;
  const now = new Date().toISOString();

  const { data: quotation, error } = await supabase
    .from('quotations')
    .insert({
      project_id: projectId,
      version: nextVersion,
      line_items: lineItems,
      total_amount: totalAmount,
      status: status,
      sent_at: status === 'SENT' || status === 'APPROVED' ? now : null,
      created_by_id: user.id,
      created_at: now,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  revalidatePath('/accounts');

  return { success: true, quotation };
}

export async function updateQuotationStatusAction(
  quotationId: string,
  projectId: string,
  newStatus: QuotationStatus
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    status: newStatus,
  };

  if (newStatus === 'SENT') {
    updatePayload.sent_at = now;
  }

  const { error } = await supabase
    .from('quotations')
    .update(updatePayload)
    .eq('id', quotationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  revalidatePath('/accounts');

  return { success: true };
}

export async function addLeadActivityAction(projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const type = formData.get('type') as LeadActivityType;
  const content = (formData.get('content') as string)?.trim();
  const callOutcome = (formData.get('callOutcome') as string)?.trim() || null;

  if (!type || !content) {
    return { error: 'Please enter activity details.' };
  }

  const { error } = await supabase
    .from('lead_activities')
    .insert({
      project_id: projectId,
      type,
      content,
      call_outcome: callOutcome,
      created_by_id: user.id,
      created_at: new Date().toISOString(),
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function deleteLeadActivityAction(activityId: string, projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('lead_activities')
    .delete()
    .eq('id', activityId)
    .eq('created_by_id', user.id);

  if (error) return { error: error.message };

  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function toggleDocumentChecklistAction(
  itemId: string,
  projectId: string,
  uploaded: boolean,
  fileUrl?: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('document_checklist_items')
    .update({
      uploaded,
      file_url: fileUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function markLeadLostAction(
  projectId: string,
  reason: LeadLostReason,
  competitorName?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('projects')
    .update({
      stage: 'CLOSED' as ProjectStage,
      lost_reason: reason,
      lost_competitor_name: competitorName || null,
      lost_at: now,
      updated_at: now,
    })
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');
  return { success: true };
}

export async function acknowledgeFollowUpAction(followUpId: string, projectId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('follow_up_logs')
    .update({ acknowledged: true })
    .eq('id', followUpId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}
