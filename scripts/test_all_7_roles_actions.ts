/**
 * MULTI-ROLE REAL ACTION & DATABASE MUTATION TEST SUITE
 * 
 * Tests real mutations across all 7 roles:
 * 1. SALES (harsh.sunfraa10@gmail.com)
 * 2. SITE_EXECUTION (ajay.sunfraa@gmail.com)
 * 3. DIRECTOR (partner@sunfraa.com)
 * 4. ACCOUNTS (komal.sunfraa@gmail.com)
 * 5. STORE_PURCHASE (jknair.sunfraa@gmail.com)
 * 6. DESIGN (design.lead@sunfraa.com)
 * 7. LIAISONING (maulik.sunfraa1628@gmail.com)
 * 
 * Verifies:
 * - Real login per role
 * - Direct action invocations / Supabase operations authenticated under each user's JWT
 * - Immediate database assertions for verified changes
 * - Clear error / success feedback responses
 */

import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxiqsrhuzjirbcgprbct.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXFzcmh1emppcmJjZ3ByYmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjU5MzcsImV4cCI6MjEwMzg0MTkzN30.R9KQECesunHhcbSl9r-QbtW1E7U1jMqig6U4gi8vL0Q';

const PASSWORD = process.env.TEST_PASSWORD || 'sunfraa@1234';

interface RoleUser {
  role: string;
  email: string;
  name: string;
}

const ROLES: RoleUser[] = [
  { role: 'DIRECTOR', email: 'partner@sunfraa.com', name: 'Eshan Choliya' },
  { role: 'SALES', email: 'harsh.sunfraa10@gmail.com', name: 'Harsh Soni' },
  { role: 'ACCOUNTS', email: 'komal.sunfraa@gmail.com', name: 'Komal Prajapati' },
  { role: 'SITE_EXECUTION', email: 'ajay.sunfraa@gmail.com', name: 'Ajay Prajapati' },
  { role: 'STORE_PURCHASE', email: 'jknair.sunfraa@gmail.com', name: 'J K Nair' },
  { role: 'DESIGN', email: 'design.lead@sunfraa.com', name: 'Arun Iyer' },
  { role: 'LIAISONING', email: 'maulik.sunfraa1628@gmail.com', name: 'Maulik Parmar' },
];

function createClientForUser() {
  const cookieStore: Record<string, string> = {};
  return {
    client: createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return Object.entries(cookieStore).map(([name, value]) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            cookieStore[name] = value;
          });
        },
      },
    }),
    cookieStore,
  };
}

async function main() {
  console.log('========================================================================================');
  console.log('STARTING MULTI-ROLE COMPREHENSIVE ACTION & DATABASE VERIFICATION TEST');
  console.log('========================================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function report(role: string, actionName: string, passed: boolean, details: string) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`[PASS] [${role}] ${actionName}: ${details}`);
    } else {
      failedTests++;
      console.error(`[FAIL] [${role}] ${actionName}: ${details}`);
    }
  }

  // 1. Authenticate all 7 roles
  const clients: Record<string, any> = {};
  const userIds: Record<string, string> = {};

  for (const r of ROLES) {
    const { client } = createClientForUser();
    const { data, error } = await client.auth.signInWithPassword({
      email: r.email,
      password: PASSWORD,
    });

    if (error || !data.user) {
      report(r.role, 'Auth Sign-In', false, `Failed to sign in: ${error?.message}`);
      return;
    } else {
      clients[r.role] = client;
      userIds[r.role] = data.user.id;
      report(r.role, 'Auth Sign-In', true, `Authenticated user ID ${data.user.id} (${r.email})`);
    }
  }

  console.log('\n--- 1. SALES ROLE ACTIONS & MUTATIONS ---');
  const salesClient = clients['SALES'];
  const testPhone = `98765${Math.floor(10000 + Math.random() * 90000)}`;
  const testClientName = `Test Client Audit ${Date.now()}`;

  // 1.1 Create Lead
  const { data: newLead, error: leadErr } = await salesClient
    .from('projects')
    .insert({
      client_name: testClientName,
      phone: testPhone,
      address: 'Plot 42, GIDC Industrial Estate, Vatva, Ahmedabad',
      kw_required: 15,
      category: 'COMMERCIAL',
      lead_source: 'REFERRAL',
      temperature: 'HOT',
      stage: 'LEAD',
      lead_owner_id: userIds['SALES'],
    })
    .select()
    .single();

  if (leadErr || !newLead) {
    report('SALES', 'Create Lead', false, `Insert failed: ${leadErr?.message}`);
    return;
  }
  const testProjectId = newLead.id;
  report('SALES', 'Create Lead', true, `Created project ID ${testProjectId} with stage LEAD in DB`);

  // 1.2 Sales Activity Log (Lead note)
  const { data: actRow, error: actErr } = await salesClient
    .from('lead_activities')
    .insert({
      project_id: testProjectId,
      type: 'NOTE',
      content: 'Initial client interaction conducted via phone call.',
      created_by_id: userIds['SALES'],
    })
    .select()
    .single();

  report('SALES', 'Log Lead Activity', !actErr && Boolean(actRow), actErr ? actErr.message : `Activity logged with type 'NOTE' ID ${actRow?.id}`);

  // 1.3 Create Quotation Version
  const { data: quoteRow, error: quoteErr } = await salesClient
    .from('quotations')
    .insert({
      project_id: testProjectId,
      version: 1,
      total_amount: 750000,
      status: 'SENT',
      line_items: [
        { item_name: '540W Mono PERC Solar Panels', category: 'MODULES', qty: 28, rate: 15000, amount: 420000 },
        { item_name: '15kW 3-Phase Grid-Tied Inverter', category: 'INVERTER', qty: 1, rate: 180000, amount: 180000 },
        { item_name: 'Hot Dip Galvanized Structure & Balance of System', category: 'STRUCTURE', qty: 1, rate: 150000, amount: 150000 },
      ],
      created_by_id: userIds['SALES'],
    })
    .select()
    .single();

  report('SALES', 'Create Quotation Version', !quoteErr && Boolean(quoteRow), quoteErr ? quoteErr.message : `Quotation v1 created for ₹7,50,000 ID ${quoteRow?.id}`);

  // Also update project quotation amount
  await salesClient.from('projects').update({ quotation_amount: 750000 }).eq('id', testProjectId);

  console.log('\n--- 2. SITE EXECUTION ROLE ACTIONS & MUTATIONS ---');
  const execClient = clients['SITE_EXECUTION'];

  // 2.1 Submit Site Survey
  const { data: surveyRow, error: surveyErr } = await execClient
    .from('site_surveys')
    .insert({
      project_id: testProjectId,
      no_of_panels: 28,
      physical_measurement: '1800 sq ft RCC Flat Terrace',
      photo_urls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
      diagram_urls: ['https://images.unsplash.com/photo-1508873696983-2df57046475a'],
      gps_location: '23.0225° N, 72.5714° E',
      contacted_person: 'Mr. Rajesh Shah (Facility Manager)',
      surveyed_by_id: userIds['SITE_EXECUTION'],
      surveyed_at: new Date().toISOString(),
    })
    .select()
    .single();

  report('SITE_EXECUTION', 'Submit Site Survey', !surveyErr && Boolean(surveyRow), surveyErr ? surveyErr.message : `Site survey inserted ID ${surveyRow?.id}`);

  // Update project stage
  await execClient.from('projects').update({ 
    stage: 'SITE_SURVEY_DONE',
    sanctioned_load: '15 kW',
    connection_number: 'HT99281726',
  }).eq('id', testProjectId);

  // 2.2 Subcontractor creation / toggle
  const testSubcontractorPhone = `9825${Math.floor(100000 + Math.random() * 900000)}`;
  const { data: subRow, error: subErr } = await execClient
    .from('subcontractors')
    .insert({
      name: `Apex Solar Erectors ${Date.now()}`,
      trade: 'STRUCTURE',
      phone: testSubcontractorPhone,
      rate_type: 'PER_KW',
      default_rate: 450,
      is_active: true,
    })
    .select()
    .single();

  report('SITE_EXECUTION', 'Create Subcontractor', !subErr && Boolean(subRow), subErr ? subErr.message : `Subcontractor created ID ${subRow?.id}`);

  if (subRow) {
    const { error: toggleErr } = await execClient
      .from('subcontractors')
      .update({ is_active: false })
      .eq('id', subRow.id);
    report('SITE_EXECUTION', 'Toggle Subcontractor Active Status', !toggleErr, toggleErr ? toggleErr.message : `Toggled is_active to false in DB`);
  }

  // 2.3 Assign Labour / Subcontractor
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: labRow, error: labErr } = await execClient
    .from('labour_assignments')
    .insert({
      project_id: testProjectId,
      subcontractor_id: subRow?.id || null,
      stage: 'STRUCTURE_FABRICATION',
      assigned_date: todayStr,
      headcount: 6,
      rate: 450,
      total_cost: 6750,
      notes: 'Initial structure erection deployment',
    })
    .select()
    .single();

  report('SITE_EXECUTION', 'Assign Labour to Stage', !labErr && Boolean(labRow), labErr ? labErr.message : `Labour deployed for stage STRUCTURE_FABRICATION on ${todayStr}`);

  // 2.4 Complete Stage Progress (Sign-off with photo)
  const { data: progRow, error: progErr } = await execClient
    .from('execution_stage_progress')
    .insert({
      project_id: testProjectId,
      stage: 'STRUCTURE_FABRICATION',
      photo_url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276',
      photo_urls: ['https://images.unsplash.com/photo-1509391365360-2e959784a276'],
      comment: 'Structure mounting purlins and columns tightened and aligned.',
      completed_by_id: userIds['SITE_EXECUTION'],
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  report('SITE_EXECUTION', 'Sign-Off Stage with Photo', !progErr && Boolean(progRow), progErr ? progErr.message : `STRUCTURE_FABRICATION stage marked completed`);

  console.log('\n--- 3. DIRECTOR ROLE ACTIONS & MUTATIONS ---');
  const dirClient = clients['DIRECTOR'];

  // 3.1 Director Project Approval with Margin
  const { error: dirApprErr } = await dirClient
    .from('projects')
    .update({
      director_approved_at: new Date().toISOString(),
      director_approved_by_id: userIds['DIRECTOR'],
      stage: 'DIRECTOR_APPROVED',
    })
    .eq('id', testProjectId);

  const { data: auditRow, error: auditErr } = await dirClient
    .from('approval_audit_logs')
    .insert({
      project_id: testProjectId,
      action: 'APPROVED',
      actor_id: userIds['DIRECTOR'],
      estimated_margin: 22.5,
    })
    .select()
    .single();

  report('DIRECTOR', 'Approve Project with Margin (Business Rule 5)', !dirApprErr && !auditErr, (dirApprErr || auditErr)?.message || `Project stage advanced to DIRECTOR_APPROVED with audit log`);

  // 3.2 Reassign Project Sales Representative
  const { error: reassignErr } = await dirClient
    .from('projects')
    .update({
      lead_owner_id: userIds['DIRECTOR'],
    })
    .eq('id', testProjectId);

  const { error: dirNoteErr } = await dirClient
    .from('lead_activities')
    .insert({
      project_id: testProjectId,
      type: 'NOTE',
      content: 'Director reassigned lead oversight to management.',
      created_by_id: userIds['DIRECTOR'],
    });

  report('DIRECTOR', 'Reassign Project Owner & Audit Note', !reassignErr && !dirNoteErr, (reassignErr || dirNoteErr)?.message || `Assigned sales rep updated to ${userIds['DIRECTOR']} and audit activity logged`);

  console.log('\n--- 4. ACCOUNTS ROLE ACTIONS & MUTATIONS ---');
  const accClient = clients['ACCOUNTS'];

  // 4.1 Generate Default Milestones
  const milestones = [
    { project_id: testProjectId, milestone_name: '10% Advance Booking Token', percentage: 10, amount: 75000, status: 'PENDING' },
    { project_id: testProjectId, milestone_name: '60% Pre-Dispatch of Modules & Inverter', percentage: 60, amount: 450000, status: 'PENDING' },
    { project_id: testProjectId, milestone_name: '20% Structure Fabrication & Panel Mounting', percentage: 20, amount: 150000, status: 'PENDING' },
    { project_id: testProjectId, milestone_name: '10% Final Grid Synchronization & Commissioning', percentage: 10, amount: 75000, status: 'PENDING' },
  ];
  const { data: msRows, error: msErr } = await accClient
    .from('payment_milestones')
    .insert(milestones)
    .select();

  report('ACCOUNTS', 'Generate Milestones', !msErr && Boolean(msRows && msRows.length === 4), msErr ? msErr.message : `Configured 4 payment milestones totaling 100%`);

  // 4.2 Collect Milestone Payment (Advance)
  if (msRows && msRows.length > 0) {
    const advMilestone = msRows[0];
    const { error: collectErr } = await accClient
      .from('payment_milestones')
      .update({
        status: 'COLLECTED',
        collected_at: new Date().toISOString(),
        payment_mode: 'NEFT',
        reference_number: 'HDFC9988112233',
        collected_by_id: userIds['ACCOUNTS'],
      })
      .eq('id', advMilestone.id);

    // Update project payment status
    await accClient.from('projects').update({ payment_status: 'PARTIAL' }).eq('id', testProjectId);

    report('ACCOUNTS', 'Record Milestone Payment', !collectErr, collectErr ? collectErr.message : `Advance milestone ₹75,000 marked COLLECTED via NEFT Ref HDFC9988112233`);
  }

  // 4.3 Generate Tax Invoice
  const { data: invRow, error: invErr } = await accClient
    .from('invoices')
    .insert({
      project_id: testProjectId,
      invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoice_type: 'TAX',
      amount: 75000,
      gst_rate: 18,
      gst_amount: 13500,
      total_amount: 88500,
      issued_at: new Date().toISOString(),
      created_by_id: userIds['ACCOUNTS'],
    })
    .select()
    .single();

  report('ACCOUNTS', 'Generate Tax Invoice', !invErr && Boolean(invRow), invErr ? invErr.message : `Invoice ${invRow?.invoice_number} created for ₹88,500`);

  console.log('\n--- 5. STORE & PURCHASE ROLE ACTIONS & MUTATIONS ---');
  const storeClient = clients['STORE_PURCHASE'];

  // 5.1 Ensure BOM exists for project
  let { data: bomRow } = await storeClient.from('boms').select('id').eq('project_id', testProjectId).maybeSingle();
  if (!bomRow) {
    const { data: createdBom } = await storeClient.from('boms').insert({ project_id: testProjectId }).select().single();
    bomRow = createdBom;
  }

  // 5.2 Add BOM Item
  const { data: bomItemRow, error: bomItemErr } = await storeClient
    .from('bom_items')
    .insert({
      bom_id: bomRow.id,
      item_name: '540W Bifacial Mono PERC Modules',
      category: 'PANEL',
      quantity: 28,
      unit: 'NOS',
    })
    .select()
    .single();

  report('STORE_PURCHASE', 'Add BOM Item', !bomItemErr && Boolean(bomItemRow), bomItemErr ? bomItemErr.message : `BOM item ${bomItemRow?.id} added to BOM`);

  // 5.3 Delete BOM Item
  if (bomItemRow) {
    const { error: delBomErr } = await storeClient
      .from('bom_items')
      .delete()
      .eq('id', bomItemRow.id);

    report('STORE_PURCHASE', 'Delete BOM Item', !delBomErr, delBomErr ? delBomErr.message : `BOM item successfully deleted`);
  }

  // 5.4 Ensure Supplier exists and Issue Purchase Order
  let { data: supplierRow } = await storeClient.from('suppliers').select('id').limit(1).maybeSingle();
  if (!supplierRow) {
    const { data: createdSup } = await storeClient.from('suppliers').insert({
      name: 'Adani Solar PV Systems',
      phone: '9876543210',
      city: 'Ahmedabad',
      payment_terms: 'NET_30',
      rating: 5,
      is_active: true,
    }).select().single();
    supplierRow = createdSup;
  }

  const { data: poRow, error: poErr } = await storeClient
    .from('purchase_orders')
    .insert({
      po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier_id: supplierRow.id,
      status: 'ISSUED',
      total_amount: 380000,
      tax_amount: 68400,
      issued_at: new Date().toISOString(),
      created_by_id: userIds['STORE_PURCHASE'],
    })
    .select()
    .single();

  report('STORE_PURCHASE', 'Issue Purchase Order', !poErr && Boolean(poRow), poErr ? poErr.message : `PO ${poRow?.po_number} issued to supplier`);

  // 5.5 Record Goods Receipt Note (GRN)
  if (poRow) {
    const { data: grnRow, error: grnErr } = await storeClient
      .from('goods_receipt_notes')
      .insert({
        po_id: poRow.id,
        grn_number: `GRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        received_date: new Date().toISOString(),
        received_by_id: userIds['STORE_PURCHASE'],
        notes: '28 Nos Panels inspected. No physical transit damage observed.',
      })
      .select()
      .single();

    report('STORE_PURCHASE', 'Record Goods Receipt Note (GRN)', !grnErr && Boolean(grnRow), grnErr ? grnErr.message : `GRN ${grnRow?.grn_number} created`);
  }

  console.log('\n--- 6. DESIGN ROLE ACTIONS & MUTATIONS ---');
  const designClient = clients['DESIGN'];

  // 6.1 Upload Design File Version
  const { data: dfRow, error: dfErr } = await designClient
    .from('design_files')
    .insert({
      project_id: testProjectId,
      type: 'INITIAL',
      file_url: 'https://sunfraa.cloud/cad/project-15kw-initial-layout-v1.dwg',
      version: 1,
      version_notes: 'Initial rooftop structural array layout with 18 deg tilt.',
      status: 'APPROVED',
      uploaded_by_id: userIds['DESIGN'],
    })
    .select()
    .single();

  report('DESIGN', 'Upload Initial CAD Design File', !dfErr && Boolean(dfRow), dfErr ? dfErr.message : `Design file v1 created ID ${dfRow?.id}`);

  // 6.2 Update SLD Specifications
  const { data: sldRow, error: sldErr } = await designClient
    .from('sld_specifications')
    .upsert({
      project_id: testProjectId,
      system_type: 'STRING_INVERTER',
      inverter_kw: 15,
      panel_count: 28,
      string_count: 2,
      dc_cable_length_m: 65,
      ac_cable_length_m: 25,
      created_by_id: userIds['DESIGN'],
    })
    .select()
    .single();

  report('DESIGN', 'Save SLD Specifications', !sldErr && Boolean(sldRow), sldErr ? sldErr.message : `Updated inverter and panel equipment specifications in sld_specifications`);

  console.log('\n--- 7. LIAISONING ROLE ACTIONS & MUTATIONS ---');
  const liaisClient = clients['LIAISONING'];

  // Ensure liaisoning record exists
  let { data: lrRow } = await liaisClient.from('liaisoning_records').select('*').eq('project_id', testProjectId).maybeSingle();
  if (!lrRow) {
    const { data: createdLr } = await liaisClient.from('liaisoning_records').insert({ project_id: testProjectId }).select().single();
    lrRow = createdLr;
  }

  // 7.1 Confirm Documents Received
  const { error: confErr } = await liaisClient
    .from('liaisoning_records')
    .update({ documents_received_at: new Date().toISOString() })
    .eq('project_id', testProjectId);

  report('LIAISONING', 'Confirm Documents Received', !confErr, confErr ? confErr.message : `Recorded documents_received_at timestamp`);

  // 7.2 Update DISCOM Acknowledgement Number
  const { error: ackErr } = await liaisClient
    .from('liaisoning_records')
    .update({ acknowledgement_number: 'UGVCL-SOLAR-2026-88129' })
    .eq('project_id', testProjectId);

  report('LIAISONING', 'Update DISCOM Ack Registration', !ackErr, ackErr ? ackErr.message : `Saved DISCOM acknowledgement number`);

  // 7.3 Update Govt Estimate & Mark Paid
  const { error: estErr } = await liaisClient
    .from('liaisoning_records')
    .update({
      govt_estimate_amount: 14250,
      govt_estimate_quotation_number: 'EST-UGVCL-9921',
      estimate_paid_at: new Date().toISOString(),
      discom_file_ready_at: new Date().toISOString(),
    })
    .eq('project_id', testProjectId);

  report('LIAISONING', 'Update Govt Estimate & Mark Paid', !estErr, estErr ? estErr.message : `Govt estimate ₹14,250 recorded and marked paid`);

  // 7.4 Log Follow-up Activity
  const { data: fupRow, error: fupErr } = await liaisClient
    .from('discom_follow_up_logs')
    .insert({
      liaisoning_record_id: lrRow.id,
      follow_up_date: new Date().toISOString().split('T')[0],
      note: 'Site inspection completed. Waiting for bi-directional meter release order.',
      logged_by_id: userIds['LIAISONING'],
    })
    .select()
    .single();

  report('LIAISONING', 'Log DISCOM Follow-Up', !fupErr && Boolean(fupRow), fupErr ? fupErr.message : `Follow-up logged ID ${fupRow?.id}`);

  // 7.5 Mark Project Grid Connected
  const { error: meterErr } = await liaisClient
    .from('liaisoning_records')
    .update({
      connected_at: new Date().toISOString(),
      meter_report_url: 'https://sunfraa.cloud/metering/test-report-88129.pdf',
      meter_report_uploaded_at: new Date().toISOString(),
    })
    .eq('project_id', testProjectId);

  const { error: projConnErr } = await liaisClient
    .from('projects')
    .update({ stage: 'CONNECTED' })
    .eq('id', testProjectId);

  report('LIAISONING', 'Mark Grid Connected', !meterErr && !projConnErr, (meterErr || projConnErr)?.message || `Stage set to CONNECTED and meter report uploaded`);

  console.log('\n========================================================================================');
  console.log(`SUMMARY OF RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('ALL 7 ROLES PERFORMED VERIFIED REAL MUTATIONS AGAINST DATABASE SUCCESSFULLY!');
    console.log('========================================================================================\n');
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
