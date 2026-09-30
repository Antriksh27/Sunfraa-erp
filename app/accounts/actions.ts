'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PaymentMode, InvoiceType } from '@/types/database';

const DEFAULT_MILESTONES = [
  { name: '10% Advance Booking Token', pct: 10 },
  { name: '60% Pre-Dispatch of Modules & Inverter', pct: 60 },
  { name: '20% Structure Fabrication & Panel Mounting', pct: 20 },
  { name: '10% Final Grid Synchronization & Commissioning', pct: 10 },
];

export async function generateDefaultMilestonesAction(projectId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const { data: project } = await supabase
    .from('projects')
    .select('quotation_amount')
    .eq('id', projectId)
    .single();

  const totalQuote = Number(project?.quotation_amount) || 0;
  if (totalQuote <= 0) {
    return { error: 'Please ensure project has a quotation amount before generating milestones.' };
  }

  // Check if milestones already exist
  const { data: existing } = await supabase
    .from('payment_milestones')
    .select('id')
    .eq('project_id', projectId);

  if (existing && existing.length > 0) {
    return { error: 'Milestones already configured for this project.' };
  }

  const rows = DEFAULT_MILESTONES.map((m) => ({
    project_id: projectId,
    milestone_name: m.name,
    percentage: m.pct,
    amount: Math.round((totalQuote * m.pct) / 100),
    status: 'PENDING',
  }));

  const { error } = await supabase.from('payment_milestones').insert(rows);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function updateMilestonesAction(
  projectId: string,
  milestones: Array<{
    id?: string;
    milestone_name: string;
    percentage: number;
    amount: number;
    due_date?: string | null;
  }>
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  const totalPct = milestones.reduce((sum, m) => sum + Number(m.percentage || 0), 0);
  if (Math.round(totalPct) !== 100) {
    return { error: `Total percentage must equal 100% (currently ${totalPct}%).` };
  }

  // Delete existing uncollected and replace or upsert
  await supabase
    .from('payment_milestones')
    .delete()
    .eq('project_id', projectId)
    .eq('status', 'PENDING');

  const insertRows = milestones.map((m) => ({
    project_id: projectId,
    milestone_name: m.milestone_name,
    percentage: m.percentage,
    amount: m.amount,
    due_date: m.due_date || null,
    status: 'PENDING',
  }));

  const { error } = await supabase.from('payment_milestones').insert(insertRows);
  if (error) return { error: error.message };

  revalidatePath('/accounts');
  revalidatePath(`/pipeline/${projectId}`);
  return { success: true };
}

export async function collectMilestonePaymentAction(
  milestoneId: string,
  projectId: string,
  paymentMode: PaymentMode,
  referenceNumber: string,
  receiptUrl?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ACCOUNTS' && profile?.role !== 'DIRECTOR') {
    return {
      error: 'Permission Denied: Only ACCOUNTS or DIRECTOR can record milestone payments.',
    };
  }

  if (!paymentMode || !referenceNumber?.trim()) {
    return { error: 'Payment mode and Transaction Reference (UTR / Cheque #) are required.' };
  }

  const now = new Date().toISOString();

  // Update milestone
  const { error: milestoneError } = await supabase
    .from('payment_milestones')
    .update({
      status: 'COLLECTED',
      collected_at: now,
      payment_mode: paymentMode,
      reference_number: referenceNumber.trim(),
      receipt_url: receiptUrl?.trim() || null,
      collected_by_id: user.id,
      updated_at: now,
    })
    .eq('id', milestoneId);

  if (milestoneError) {
    return { error: milestoneError.message };
  }

  revalidatePath('/accounts');
  revalidatePath('/pipeline');
  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/liaisoning');

  return { success: true };
}

export async function createInvoiceAction(
  projectId: string,
  invoiceType: InvoiceType,
  amount: number,
  gstRate: number = 13.8,
  pdfUrl?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized.' };

  if (amount <= 0) return { error: 'Invoice amount must be greater than zero.' };

  const gstAmount = Math.round(((amount * gstRate) / 100) * 100) / 100;
  const totalAmount = amount + gstAmount;

  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `SUN-${year}-${randomSuffix}`;

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      project_id: projectId,
      invoice_number: invoiceNumber,
      invoice_type: invoiceType,
      amount,
      gst_rate: gstRate,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      issued_at: new Date().toISOString(),
      pdf_url: pdfUrl || null,
      created_by_id: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/accounts');
  return { success: true, invoice: data };
}

export async function recordDirectPaymentAction(
  projectId: string,
  amount: number,
  paymentMode: PaymentMode,
  referenceNumber: string,
  milestoneId?: string | null,
  receiptUrl?: string,
  notes?: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ACCOUNTS' && profile?.role !== 'DIRECTOR') {
    return {
      error: 'Permission Denied: Only ACCOUNTS or DIRECTOR can record payments.',
    };
  }

  if (amount <= 0) {
    return { error: 'Payment amount must be greater than zero.' };
  }

  if (!paymentMode || !referenceNumber?.trim()) {
    return { error: 'Payment mode and Transaction Reference (UTR / Cheque #) are required.' };
  }

  const now = new Date().toISOString();

  // 1. If a specific milestone was selected, update it
  if (milestoneId) {
    const { error: mError } = await supabase
      .from('payment_milestones')
      .update({
        status: 'COLLECTED',
        collected_at: now,
        payment_mode: paymentMode,
        reference_number: referenceNumber.trim(),
        receipt_url: receiptUrl?.trim() || null,
        collected_by_id: user.id,
        updated_at: now,
      })
      .eq('id', milestoneId);

    if (mError) return { error: mError.message };
  } else {
    // 2. Otherwise insert a milestone record for this payment
    const { data: project } = await supabase
      .from('projects')
      .select('quotation_amount')
      .eq('id', projectId)
      .single();

    const quote = Number(project?.quotation_amount) || amount;
    const pct = quote > 0 ? Math.min(100, Math.round((amount / quote) * 100)) : 100;

    await supabase.from('payment_milestones').insert({
      project_id: projectId,
      milestone_name: pct === 100 ? '100% Full Project Payment' : `${pct}% Payment Collection`,
      percentage: pct,
      amount: amount,
      status: 'COLLECTED',
      collected_at: now,
      payment_mode: paymentMode,
      reference_number: referenceNumber.trim(),
      receipt_url: receiptUrl?.trim() || null,
      collected_by_id: user.id,
    });
  }

  // 3. Update project status and stage
  const { data: projMilestones } = await supabase
    .from('payment_milestones')
    .select('amount, status')
    .eq('project_id', projectId);

  const totalCollected = (projMilestones || [])
    .filter((m) => m.status === 'COLLECTED')
    .reduce((sum, m) => sum + Number(m.amount), 0);

  const { data: projectRecord } = await supabase
    .from('projects')
    .select('quotation_amount, stage')
    .eq('id', projectId)
    .single();

  const quoteTotal = Number(projectRecord?.quotation_amount) || amount;
  const isFull = totalCollected >= quoteTotal;

  const { error: projError } = await supabase
    .from('projects')
    .update({
      payment_status: isFull ? 'COLLECTED' : 'PARTIAL',
      payment_collected_at: now,
      payment_collected_by_id: user.id,
      stage: isFull && ['LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE'].includes(projectRecord?.stage || '')
        ? 'PAYMENT_COLLECTED'
        : projectRecord?.stage,
      updated_at: now,
    })
    .eq('id', projectId);

  if (projError) return { error: projError.message };

  revalidatePath('/accounts');
  revalidatePath('/pipeline');
  revalidatePath(`/pipeline/${projectId}`);
  revalidatePath('/liaisoning');

  return { success: true };
}
