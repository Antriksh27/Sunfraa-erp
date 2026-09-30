'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProjectStage, PortalRoute, SubsidyType } from '@/types/database';

export async function updatePortalRouteAction(
  projectId: string,
  portalRoute: PortalRoute,
  subsidyType?: SubsidyType | null
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!portalRoute) {
    return { error: 'Please select a statutory portal route.' };
  }

  if (portalRoute === 'NATIONAL_PORTAL_SUBSIDY' && !subsidyType) {
    return { error: 'Please select a subsidy scheme type for the National Portal.' };
  }

  const finalSubsidyType = portalRoute === 'NATIONAL_PORTAL_SUBSIDY' ? subsidyType : null;

  const { error } = await supabase
    .from('liaisoning_records')
    .upsert(
      {
        project_id: projectId,
        portal_route: portalRoute,
        subsidy_type: finalSubsidyType,
      },
      { onConflict: 'project_id' }
    );

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function confirmDocumentsReceivedAction(projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('liaisoning_records')
    .update({ documents_received_at: new Date().toISOString() })
    .eq('project_id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function updateRegistrationNumberAction(projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const acknowledgementNumber = formData.get('acknowledgementNumber') as string;

  if (!acknowledgementNumber) {
    return { error: 'Please enter a DISCOM application/acknowledgement number.' };
  }

  const { error } = await supabase
    .from('liaisoning_records')
    .update({ acknowledgement_number: acknowledgementNumber })
    .eq('project_id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function updateGovtEstimateAction(projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const quotationNumber = formData.get('govtEstimateQuotationNumber') as string;
  const amount = parseFloat(formData.get('govtEstimateAmount') as string);

  if (!quotationNumber || isNaN(amount) || amount < 0) {
    return { error: 'Please enter a valid government estimate quotation number and fee amount.' };
  }

  const { error } = await supabase
    .from('liaisoning_records')
    .update({
      govt_estimate_quotation_number: quotationNumber,
      govt_estimate_amount: amount,
    })
    .eq('project_id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function markEstimatePaidAction(projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('liaisoning_records')
    .update({
      estimate_paid_at: now,
      discom_file_ready_at: now,
    })
    .eq('project_id', projectId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function logDiscomFollowUpAction(
  liaisoningRecordId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const followUpDate = formData.get('followUpDate') as string;
  const note = formData.get('note') as string;

  if (!followUpDate || !note) {
    return { error: 'Follow-up date and remarks are required.' };
  }

  const { error } = await supabase.from('discom_follow_up_logs').insert({
    liaisoning_record_id: liaisoningRecordId,
    follow_up_date: followUpDate,
    note,
    logged_by_id: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  return { success: true };
}

export async function markConnectedAndUploadMeterReportAction(
  projectId: string,
  meterReportUrl: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  if (!meterReportUrl) {
    return { error: 'Meter test report file URL is required.' };
  }

  const now = new Date().toISOString();

  // 1. Update Liaisoning Record
  const { error: recordError } = await supabase
    .from('liaisoning_records')
    .update({
      connected_at: now,
      meter_report_url: meterReportUrl,
      meter_report_uploaded_at: now,
    })
    .eq('project_id', projectId);

  if (recordError) {
    return { error: recordError.message };
  }

  // 2. Advance project stage to CONNECTED
  const { error: projectError } = await supabase
    .from('projects')
    .update({
      stage: 'CONNECTED' as ProjectStage,
      updated_at: now,
    })
    .eq('id', projectId);

  if (projectError) {
    return { error: projectError.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/pipeline');

  return { success: true };
}

export async function updateCEIRecordAction(projectId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized.' };
  }

  const selfCertGen = formData.get('selfCertificateGenerated') === 'true';
  const clientSigning = formData.get('filedForClientSigning') === 'true';
  const drawingFileId = (formData.get('drawingApprovalDesignFileId') as string) || null;
  const portalRefNumber = (formData.get('ceiPortalReferenceNumber') as string) || null;
  const isApproved = formData.get('ceiApproved') === 'true';
  const approvalUploadUrl = (formData.get('ceiApprovalUploadUrl') as string) || null;
  const inspectionRef = (formData.get('inspectionReferenceNumber') as string) || null;
  const inspectorName = (formData.get('inspectorName') as string) || null;
  const inspectorDate = (formData.get('inspectorDate') as string) || null;
  const inspectorContact = (formData.get('inspectorContact') as string) || null;

  const now = new Date().toISOString();

  const { error } = await supabase.from('cei_records').upsert({
    project_id: projectId,
    self_certificate_generated_at: selfCertGen ? now : null,
    filed_for_client_signing_at: clientSigning ? now : null,
    drawing_approval_design_file_id: drawingFileId,
    cei_portal_reference_number: portalRefNumber,
    cei_approved_at: isApproved ? now : null,
    cei_approval_upload_url: approvalUploadUrl,
    inspection_reference_number: inspectionRef,
    inspector_name: inspectorName,
    inspector_date: inspectorDate || null,
    inspector_contact: inspectorContact,
  }, { onConflict: 'project_id' });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function saveDISCOMPortalRecordAction(
  projectId: string,
  payload: {
    portalName: import('@/types/database').DISCOMPortalName;
    portalOtherName?: string;
    applicationNumber: string;
    ackReceiptUrl?: string;
    status: import('@/types/database').DISCOMAppStatus;
    queryText?: string;
    queryRaisedAt?: string;
    queryResolvedAt?: string;
    approvedAt?: string;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('discom_portal_records').insert({
    project_id: projectId,
    portal_name: payload.portalName,
    portal_other_name: payload.portalName === 'OTHER' ? (payload.portalOtherName || null) : null,
    application_number: payload.applicationNumber,
    ack_receipt_url: payload.ackReceiptUrl || null,
    status: payload.status,
    query_text: payload.queryText || null,
    query_raised_at: payload.queryRaisedAt || null,
    query_resolved_at: payload.queryResolvedAt || null,
    approved_at: payload.approvedAt || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/liaisoning/${projectId}`);
  revalidatePath('/liaisoning');
  return { success: true };
}

export async function saveCEIInspectorLogAction(
  projectId: string,
  payload: {
    inspectorName: string;
    inspectorPhone?: string;
    scheduledDate: string;
    visitCompleted: boolean;
    reportNotes?: string;
    certificateUrl?: string;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('cei_inspector_logs').insert({
    project_id: projectId,
    inspector_name: payload.inspectorName,
    inspector_phone: payload.inspectorPhone || null,
    scheduled_date: payload.scheduledDate,
    visit_completed: payload.visitCompleted,
    report_notes: payload.reportNotes || null,
    certificate_url: payload.certificateUrl || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/liaisoning/${projectId}`);
  return { success: true };
}

export async function saveMeterTestRecordAction(
  projectId: string,
  payload: {
    meterSerialNumber: string;
    ctPtRatio?: string;
    testReportNumber: string;
    testDate: string;
    passed: boolean;
    testReportUrl?: string;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('meter_test_records').insert({
    project_id: projectId,
    meter_serial_number: payload.meterSerialNumber,
    ct_pt_ratio: payload.ctPtRatio || null,
    test_report_number: payload.testReportNumber,
    test_date: payload.testDate,
    passed: payload.passed,
    test_report_url: payload.testReportUrl || null,
  });

  if (error) return { error: error.message };

  if (payload.passed && payload.testReportUrl) {
    await supabase
      .from('liaisoning_records')
      .update({
        meter_report_url: payload.testReportUrl,
        meter_report_uploaded_at: new Date().toISOString(),
      })
      .eq('project_id', projectId);
  }

  revalidatePath(`/liaisoning/${projectId}`);
  return { success: true };
}

export async function saveSubsidyClaimAction(
  projectId: string,
  payload: {
    consumerNumber?: string;
    nationalPortalAppNo: string;
    subsidyAmount: number;
    claimSubmittedAt: string;
    inspectedAt?: string;
    disbursedAt?: string;
    utrNumber?: string;
    status: import('@/types/database').SubsidyClaimStatus;
  }
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { error } = await supabase.from('subsidy_claims').insert({
    project_id: projectId,
    consumer_number: payload.consumerNumber || null,
    national_portal_app_no: payload.nationalPortalAppNo,
    subsidy_amount: payload.subsidyAmount,
    claim_submitted_at: payload.claimSubmittedAt,
    inspected_at: payload.inspectedAt || null,
    disbursed_at: payload.disbursedAt || null,
    utr_number: payload.utrNumber || null,
    status: payload.status,
  });

  if (error) return { error: error.message };

  revalidatePath(`/liaisoning/${projectId}`);
  return { success: true };
}
