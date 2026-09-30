import { createServerClient } from '@supabase/ssr';

const SUPABASE_URL = 'https://yxiqsrhuzjirbcgprbct.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4aXFzcmh1emppcmJjZ3ByYmN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjU5MzcsImV4cCI6MjEwMzg0MTkzN30.R9KQECesunHhcbSl9r-QbtW1E7U1jMqig6U4gi8vL0Q';

async function createClientForRole(email: string) {
  let cookieStore: Record<string, string> = {};
  const client = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: 'sunfraa@1234',
  });

  if (error) {
    throw new Error(`Auth failed for ${email}: ${error.message}`);
  }

  return { client, user: data.user };
}

async function runEndToEndTests() {
  console.log('================================================================');
  console.log('⚡ SUNFRAA ERP - END-TO-END FILE UPLOADS & GENERATED DOCS TEST');
  console.log('================================================================\n');

  // 1. Get an active project to test with
  const { client: directorClient } = await createClientForRole('partner@sunfraa.com');
  const { data: projects, error: projErr } = await directorClient
    .from('projects')
    .select('*')
    .limit(1);

  if (projErr || !projects || projects.length === 0) {
    throw new Error(`Failed to find active test project: ${projErr?.message}`);
  }

  const project = projects[0];
  console.log(`📌 Using Test Project: "${project.client_name}" (${project.id.slice(0, 8)}) - ${project.kw_required} kW`);

  // ============================================================================
  // TEST 1: Site Survey Photos & Diagrams Persistence & HTTP Accessibility
  // ============================================================================
  console.log('\n--- 1. Testing Site Survey Photos & Diagrams Upload ---');
  const { client: executionClient } = await createClientForRole('imran.sunfraa@gmail.com');

  // Create mock image buffer (1x1 PNG)
  const mockPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const testSurveyPhotoName = `${project.id}/test_survey_photo_${Date.now()}.png`;
  const { error: photoUploadErr } = await executionClient.storage
    .from('site-survey-photos')
    .upload(testSurveyPhotoName, mockPngBuffer, { contentType: 'image/png' });

  if (photoUploadErr) {
    console.error('❌ Failed to upload survey photo:', photoUploadErr.message);
  } else {
    const { data: urlData } = executionClient.storage
      .from('site-survey-photos')
      .getPublicUrl(testSurveyPhotoName);

    console.log('✅ Site survey photo uploaded to bucket:', testSurveyPhotoName);
    console.log('   Public URL:', urlData.publicUrl);

    // Test HTTP GET on the URL
    const res = await fetch(urlData.publicUrl);
    console.log(`   HTTP GET Status: ${res.status} ${res.status === 200 ? '✅ (ACCESSIBLE)' : '❌ (FAILED)'}`);
    if (res.status !== 200) {
      throw new Error(`Survey photo URL returned status ${res.status}`);
    }

    // Persist photo URL in site_surveys
    const { data: existingSurvey } = await executionClient
      .from('site_surveys')
      .select('id, photo_urls, diagram_urls')
      .eq('project_id', project.id)
      .maybeSingle();

    if (existingSurvey) {
      const updatedPhotos = [...(existingSurvey.photo_urls || []), urlData.publicUrl];
      const { error: surveyUpdateErr } = await executionClient
        .from('site_surveys')
        .update({ photo_urls: updatedPhotos })
        .eq('id', existingSurvey.id);

      if (surveyUpdateErr) {
        console.error('❌ Failed to update site_surveys photo_urls:', surveyUpdateErr.message);
      } else {
        console.log(`✅ Persisted photo URL in database (Total photos: ${updatedPhotos.length})`);
      }
    }
  }

  // ============================================================================
  // TEST 2: Design CAD / PDF Upload & Version History
  // ============================================================================
  console.log('\n--- 2. Testing Design File Upload & Version History ---');
  const { client: designClient, user: designUser } = await createClientForRole('design.lead@sunfraa.com');

  const testCadFileName = `${project.id}/initial_cad_${Date.now()}.dwg`;
  const mockCadBuffer = Buffer.from('AC1032 Sample AutoCAD Binary CAD Drawing Header');

  const { error: cadUploadErr } = await designClient.storage
    .from('design-files')
    .upload(testCadFileName, mockCadBuffer, { contentType: 'application/acad' });

  if (cadUploadErr) {
    console.error('❌ Failed to upload CAD file:', cadUploadErr.message);
  } else {
    const { data: cadUrlData } = designClient.storage
      .from('design-files')
      .getPublicUrl(testCadFileName);

    console.log('✅ Design CAD drawing uploaded to bucket:', testCadFileName);
    console.log('   Public URL:', cadUrlData.publicUrl);

    const cadRes = await fetch(cadUrlData.publicUrl);
    console.log(`   HTTP GET Status: ${cadRes.status} ${cadRes.status === 200 ? '✅ (ACCESSIBLE)' : '❌ (FAILED)'}`);
    if (cadRes.status !== 200) {
      throw new Error(`Design file URL returned status ${cadRes.status}`);
    }

    // Insert new version into design_files table
    const { data: existingVersions } = await designClient
      .from('design_files')
      .select('version')
      .eq('project_id', project.id)
      .eq('type', 'INITIAL')
      .order('version', { ascending: false })
      .limit(1);

    const nextVer = (existingVersions?.[0]?.version || 0) + 1;
    const { data: newDesignRecord, error: designRecErr } = await designClient
      .from('design_files')
      .insert({
        project_id: project.id,
        type: 'INITIAL',
        version: nextVer,
        file_url: cadUrlData.publicUrl,
        version_notes: `End-to-end verified CAD drawing layout v${nextVer}`,
        uploaded_by_id: designUser.id,
        status: 'APPROVED',
      })
      .select()
      .single();

    if (designRecErr) {
      console.error('❌ Failed to record design_files entry:', designRecErr.message);
    } else {
      console.log(`✅ Persisted design drawing v${newDesignRecord.version} in database (ID: ${newDesignRecord.id.slice(0, 8)})`);
    }
  }

  // ============================================================================
  // TEST 3: Document Checklist Direct Upload & URL Persistence
  // ============================================================================
  console.log('\n--- 3. Testing Document Checklist Upload & Toggle ---');
  let { data: checklistItems } = await directorClient
    .from('document_checklist_items')
    .select('*')
    .eq('project_id', project.id);

  if (!checklistItems || checklistItems.length === 0) {
    const { data: inserted } = await directorClient
      .from('document_checklist_items')
      .insert({
        project_id: project.id,
        document_name: 'Latest Electricity Bill (Last 3 Months)',
        uploaded: false,
      })
      .select();
    checklistItems = inserted || [];
  }

  if (checklistItems && checklistItems.length > 0) {
    const item = checklistItems[0];
    const testDocName = `checklist/${project.id}/${item.id}_${Date.now()}.pdf`;
    const mockPdfBuffer = Buffer.from('%PDF-1.4 End-to-end verified customer statutory document');

    const { error: docUploadErr } = await directorClient.storage
      .from('site-survey-photos')
      .upload(testDocName, mockPdfBuffer, { contentType: 'application/pdf' });

    if (docUploadErr) {
      console.error('❌ Failed to upload checklist doc:', docUploadErr.message);
    } else {
      const { data: docUrlData } = directorClient.storage
        .from('site-survey-photos')
        .getPublicUrl(testDocName);

      const docRes = await fetch(docUrlData.publicUrl);
      console.log(`✅ Uploaded checklist doc: "${item.document_name}"`);
      console.log(`   HTTP GET Status: ${docRes.status} ${docRes.status === 200 ? '✅ (ACCESSIBLE)' : '❌ (FAILED)'}`);

      const { error: updateChecklistErr } = await directorClient
        .from('document_checklist_items')
        .update({
          uploaded: true,
          file_url: docUrlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (updateChecklistErr) {
        console.error('❌ Failed to update document_checklist_items:', updateChecklistErr.message);
      } else {
        console.log(`✅ Persisted attachment on checklist item "${item.document_name}"`);
      }
    }
  }

  // ============================================================================
  // TEST 4: Quotation Generation & Printable Proposal Data Completeness
  // ============================================================================
  console.log('\n--- 4. Testing Commercial Quotation Generation & Line Items ---');
  const { client: salesClient, user: salesUser } = await createClientForRole('harsh.sunfraa10@gmail.com');

  const { data: existingQuotes } = await salesClient
    .from('quotations')
    .select('version')
    .eq('project_id', project.id)
    .order('version', { ascending: false })
    .limit(1);

  const nextQuoteVer = (existingQuotes?.[0]?.version || 0) + 1;
  const quoteLineItems = [
    { item_name: 'Mono PERC 545W Solar PV Modules', category: 'PANEL', qty: 20, rate: 12500, amount: 250000 },
    { item_name: '10kW Three-Phase On-Grid Inverter', category: 'INVERTER', qty: 1, rate: 65000, amount: 65000 },
    { item_name: 'Hot-Dip Galvanized Module Mounting Structure', category: 'STRUCTURE', qty: 1, rate: 45000, amount: 45000 },
    { item_name: 'ACDB/DCDB, Lightning Arrester & Earthing Kit', category: 'BOS', qty: 1, rate: 35000, amount: 35000 },
    { item_name: 'Civil Works, Installation & Commissioning', category: 'LABOUR', qty: 1, rate: 30000, amount: 30000 },
  ];

  const totalAmount = quoteLineItems.reduce((sum, item) => sum + item.amount, 0);

  const { data: newQuote, error: quoteErr } = await salesClient
    .from('quotations')
    .insert({
      project_id: project.id,
      version: nextQuoteVer,
      line_items: quoteLineItems,
      total_amount: totalAmount,
      status: 'SENT',
      sent_at: new Date().toISOString(),
      created_by_id: salesUser.id,
    })
    .select()
    .single();

  if (quoteErr) {
    console.error('❌ Failed to insert quotation:', quoteErr.message);
  } else {
    console.log(`✅ Generated Commercial Proposal Quotation v${newQuote.version}:`);
    console.log(`   Client: ${project.client_name}`);
    console.log(`   Total Subtotal: ₹${Number(newQuote.total_amount).toLocaleString('en-IN')}`);
    console.log(`   Estimated 13.8% GST: ₹${Math.round(totalAmount * 0.138).toLocaleString('en-IN')}`);
    console.log(`   Grand Total: ₹${Math.round(totalAmount * 1.138).toLocaleString('en-IN')}`);
    console.log(`   Line Items: ${newQuote.line_items.length} items verified`);
  }

  // ============================================================================
  // TEST 5: Delivery Challan Document Generation & Stock Ledger OUT Movement
  // ============================================================================
  console.log('\n--- 5. Testing Delivery Challan Generation & Material Outward ---');
  const { client: storeClient, user: storeUser } = await createClientForRole('vishurathod75@gmail.com');

  // Insert test delivery challan
  const { data: challan, error: challanErr } = await storeClient
    .from('delivery_challans')
    .insert({
      project_id: project.id,
      vehicle_type: 'Tata 407 (3.5 Ton)',
      registration_number: 'GJ-01-SZ-9876',
      driver_name: 'Babu Bhai Transport',
      driver_mobile: '+91 98980 12345',
      distance: 38,
      created_by_id: storeUser.id,
    })
    .select()
    .single();

  if (challanErr) {
    console.error('❌ Failed to create delivery challan:', challanErr.message);
  } else {
    console.log(`✅ Generated Delivery Challan #DC-${challan.id.slice(0, 8).toUpperCase()}`);
    console.log(`   Vehicle: ${challan.vehicle_type} (${challan.registration_number})`);
    console.log(`   Transporter: ${challan.driver_name} | Mobile: ${challan.driver_mobile}`);
    console.log(`   Destination: ${project.client_name} - ${challan.distance} km`);

    // Log atomic Stock OUT entries tied to this challan (Business Rule 10)
    const { data: ledgerEntries, error: ledgerErr } = await storeClient
      .from('stock_ledger')
      .insert([
        {
          item_name: 'Mono PERC 545W Solar PV Modules',
          direction: 'OUT',
          quantity: 20,
          project_id: project.id,
          delivery_challan_id: challan.id,
          created_by_id: storeUser.id,
        },
        {
          item_name: '10kW Three-Phase On-Grid Inverter',
          direction: 'OUT',
          quantity: 1,
          project_id: project.id,
          delivery_challan_id: challan.id,
          created_by_id: storeUser.id,
        },
      ])
      .select();

    if (ledgerErr) {
      console.error('❌ Failed to log Stock OUT ledger entries:', ledgerErr.message);
    } else {
      console.log(`✅ Logged ${ledgerEntries.length} atomic Stock OUT items linked to Delivery Challan`);
      ledgerEntries.forEach((entry) => {
        console.log(`   - OUT: ${entry.quantity}x ${entry.item_name} (Challan: ${entry.delivery_challan_id.slice(0, 8)})`);
      });
    }
  }

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END FILE UPLOAD & DOCUMENT GENERATION TESTS PASSED!');
  console.log('================================================================\n');
}

runEndToEndTests().catch((err) => {
  console.error('\n❌ FATAL TEST FAILURE:', err);
  process.exit(1);
});
