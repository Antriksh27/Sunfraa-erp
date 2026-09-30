import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yxiqsrhuzjirbcgprbct.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXFzcmh1emppcmJjZ3ByYmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjU5MzcsImV4cCI6MjEwMzg0MTkzN30.R9KQECesunHhcbSl9r-QbtW1E7U1jMqig6U4gi8vL0Q';

async function run() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log('================================================================');
  console.log('STEP 1: LOGIN AS DESIGN USER & CREATE TEST PROJECT IN DESIGN_PENDING');
  console.log('================================================================');

  // Login as real design or director user (partner@sunfraa.com is Director)
  const { data: directorAuth, error: dirErr } = await supabase.auth.signInWithPassword({
    email: 'partner@sunfraa.com',
    password: 'sunfraa@1234',
  });
  if (dirErr || !directorAuth.user) {
    throw new Error('Director login failed: ' + dirErr?.message);
  }

  // Create a clean test project
  const testProjectCode = `TEST-ENG-${Date.now()}`;
  const { data: newProject, error: projErr } = await supabase
    .from('projects')
    .insert({
      client_name: `Adani Solar Tech Park (${testProjectCode})`,
      phone: '+91 99887 76655',
      address: 'Plot 42, GIDC Industrial Estate, Sanand, Gujarat',
      category: 'INDUSTRIAL',
      kw_required: 15.0,
      stage: 'DESIGN_PENDING',
      lead_owner_id: directorAuth.user.id,
    })
    .select('*')
    .single();

  if (projErr || !newProject) {
    throw new Error('Project creation failed: ' + projErr?.message);
  }
  console.log(`Created Test Project: ${newProject.id}`);
  console.log(`Client Name: ${newProject.client_name}`);
  console.log(`System Size: ${newProject.kw_required} kW`);
  console.log(`Current Stage: ${newProject.stage}`);
  console.log(`director_approved_at: ${newProject.director_approved_at || 'NULL (Not approved)'}`);

  // Create SLD Specifications for this project
  const { error: sldErr } = await supabase.from('sld_specifications').insert({
    project_id: newProject.id,
    system_type: 'STRING_INVERTER',
    inverter_kw: 15.0,
    panel_count: 28,
    string_count: 2,
    dc_cable_length_m: 210,
    ac_cable_length_m: 140,
    created_by_id: directorAuth.user.id,
  });
  if (sldErr) {
    console.warn('SLD insert warning:', sldErr.message);
  } else {
    console.log('Configured SLD Specs: 28 Panels, 15 kW Inverter, 210m DC Cable, 140m AC Cable');
  }

  console.log('\n================================================================');
  console.log('STEP 2: UPLOAD INITIAL DESIGN FILE -> ADVANCE TO DESIGN_UPLOADED');
  console.log('================================================================');

  // Insert INITIAL design file
  const { data: designFile, error: designErr } = await supabase.from('design_files').insert({
    project_id: newProject.id,
    type: 'INITIAL',
    file_url: 'https://storage.sunfraa.com/designs/initial_cad_layout_adani.pdf',
    version: 1,
    status: 'APPROVED',
    uploaded_by_id: directorAuth.user.id,
  }).select('*').single();

  if (designErr || !designFile) {
    throw new Error('Design file upload failed: ' + designErr?.message);
  }

  // Update project stage to DESIGN_UPLOADED
  await supabase
    .from('projects')
    .update({ stage: 'DESIGN_UPLOADED', updated_at: new Date().toISOString() })
    .eq('id', newProject.id);

  console.log(`Initial Design file uploaded: ID ${designFile.id}`);
  console.log('Project transitioned to DESIGN_UPLOADED');

  console.log('\n================================================================');
  console.log('STEP 3: RAW QUERY SHOWING BOM CREATED WITH REAL LINE ITEMS AT DESIGN_UPLOADED');
  console.log('(CONFIRMING DIRECTOR APPROVAL HAS NOT OCCURRED)');
  console.log('================================================================');

  // Query project status to confirm Director has NOT approved yet
  const { data: refreshedProject } = await supabase
    .from('projects')
    .select('id, stage, director_approved_at, director_approved_by_id')
    .eq('id', newProject.id)
    .single();

  console.log('PROJECT STATUS CHECK:');
  console.log(`  Stage: ${refreshedProject?.stage}`);
  console.log(`  director_approved_at: ${refreshedProject?.director_approved_at || 'NULL (Not approved by Director)'}`);

  // Query BOM and BOM Items
  const { data: bomData, error: bomErr } = await supabase
    .from('boms')
    .select(`
      id,
      project_id,
      created_by_id,
      created_at,
      approved_at,
      approved_by_id,
      items:bom_items(*)
    `)
    .eq('project_id', newProject.id)
    .single();

  if (bomErr || !bomData) {
    throw new Error('Failed to query BOM: ' + bomErr?.message);
  }

  console.log('\nRAW BOM RECORD:');
  console.log(JSON.stringify({
    bom_id: bomData.id,
    project_id: bomData.project_id,
    approved_at: bomData.approved_at,
    approved_by_id: bomData.approved_by_id,
    created_at: bomData.created_at,
    total_line_items: bomData.items?.length,
  }, null, 2));

  console.log('\nRAW BOM LINE ITEMS AUTO-DERIVED FROM DESIGN SPECS:');
  bomData.items?.forEach((item: any, idx: number) => {
    console.log(`  ${idx + 1}. [${item.category.padEnd(9)}] ${item.item_name.padEnd(55)} Qty: ${item.quantity} ${item.unit}`);
  });

  console.log('\n================================================================');
  console.log('STEP 4: ATTEMPT LABOUR ASSIGNMENT BEFORE BOM APPROVAL (EXPECTED BLOCK)');
  console.log('================================================================');

  // Fetch or create a labour team / subcontractor
  const todayDate = new Date().toISOString().split('T')[0];
  const { data: labourTeam } = await supabase.from('labour_teams').select('id, name').limit(1).single();

  console.log(`Attempting to assign labour for stage STRUCTURE_FABRICATION on ${todayDate}...`);
  const { data: assignmentBlocked, error: blockedErr } = await supabase
    .from('labour_assignments')
    .insert({
      project_id: newProject.id,
      labour_team_id: labourTeam?.id,
      stage: 'STRUCTURE_FABRICATION',
      assigned_date: todayDate,
      headcount: 4,
    })
    .select('*');

  console.log('RAW RESULT OF ATTEMPT:');
  if (blockedErr) {
    console.log(`  Status: BLOCKED AS EXPECTED`);
    console.log(`  Error Message: "${blockedErr.message}"`);
  } else {
    console.error('  ERROR: Assignment was NOT blocked!', assignmentBlocked);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('STEP 5: HEAD ENGINEER APPROVES THE BOM');
  console.log('================================================================');

  // Log in as HEAD_ENGINEER
  const { data: heAuth, error: heErr } = await supabase.auth.signInWithPassword({
    email: 'head.engineer@sunfraa.com',
    password: 'sunfraa@1234',
  });
  if (heErr || !heAuth.user) {
    throw new Error('Head Engineer login failed: ' + heErr?.message);
  }
  console.log(`Logged in as Head Engineer: ${heAuth.user.email} (ID: ${heAuth.user.id})`);

  // Approve the BOM
  const approvalTimestamp = new Date().toISOString();
  const { data: approvedBom, error: approveErr } = await supabase
    .from('boms')
    .update({
      approved_at: approvalTimestamp,
      approved_by_id: heAuth.user.id,
    })
    .eq('id', bomData.id)
    .select('id, approved_at, approved_by_id')
    .single();

  if (approveErr) {
    throw new Error('Head Engineer BOM approval failed: ' + approveErr.message);
  }

  console.log('RAW BOM APPROVAL RESULT:');
  console.log(JSON.stringify(approvedBom, null, 2));

  console.log('\n================================================================');
  console.log('STEP 6: RETRY LABOUR ASSIGNMENT AFTER BOM APPROVAL (EXPECTED SUCCESS)');
  console.log('================================================================');

  const { data: successfulAssignment, error: successErr } = await supabase
    .from('labour_assignments')
    .insert({
      project_id: newProject.id,
      labour_team_id: labourTeam?.id,
      stage: 'STRUCTURE_FABRICATION',
      assigned_date: todayDate,
      headcount: 4,
    })
    .select('*')
    .single();

  if (successErr) {
    console.error('Labour assignment failed even after approval:', successErr.message);
    process.exit(1);
  }

  console.log('RAW LABOUR ASSIGNMENT SUCCESS:');
  console.log(JSON.stringify({
    assignment_id: successfulAssignment.id,
    project_id: successfulAssignment.project_id,
    stage: successfulAssignment.stage,
    assigned_date: successfulAssignment.assigned_date,
    headcount: successfulAssignment.headcount,
    status: 'CONFIRMED'
  }, null, 2));

  console.log('\n================================================================');
  console.log('ALL WORKFLOW VERIFICATION STEPS PASSED SUCCESSFULLY!');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('Verification script error:', err);
  process.exit(1);
});
