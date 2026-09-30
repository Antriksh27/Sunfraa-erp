-- =============================================================================
-- Migration: 00019_demo_seed.sql
-- Description: DEMO DATA SEED — Sunfraa Global ERP
--
-- ⚠️  THIS IS DEMO / TEST DATA ONLY.
--     To remove ALL demo data, run: 00019_demo_teardown.sql
--
-- Covers all 8 ERP modules:
--   1. Sales Pipeline   (leads at every stage)
--   2. Accounts         (payment records)
--   3. Project Execution (labour teams, progress, completions)
--   4. Director Approvals (approved projects)
--   5. Store & Purchase (BOMs, stock ledger, POs, GRNs, challans)
--   6. Design Team      (design files)
--   7. Liaisoning & CEI (liaisoning & CEI records)
--   8. Manager Control  (users for every role)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 0 ─ DEMO USER ACCOUNTS (one per role + director already exists)
-- Passwords for all demo users:  Demo@1234
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_sales_id     uuid := 'a1000001-0000-4000-8000-000000000001';
  v_accounts_id  uuid := 'a1000002-0000-4000-8000-000000000002';
  v_exec_id      uuid := 'a1000003-0000-4000-8000-000000000003';
  v_store_id     uuid := 'a1000004-0000-4000-8000-000000000004';
  v_design_id    uuid := 'a1000005-0000-4000-8000-000000000005';
  v_liaison_id   uuid := 'a1000006-0000-4000-8000-000000000006';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_sales_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_sales_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'sales.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Rohan Sharma"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_accounts_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_accounts_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'accounts.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Priya Nair"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_exec_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_exec_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'execution.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Vikram Patel"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_store_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_store_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'store.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Meena Joshi"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_design_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_design_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'design.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Arun Iyer"}'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_liaison_id) THEN
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    VALUES (
      v_liaison_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'liaisoning.demo@sunfraaglobal.com',
      crypt('Demo@1234', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Kavita Desai"}'
    );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 ─ PROFILES (map auth users → profiles)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.profiles (id, name, phone, role, active)
VALUES
  ('a1000001-0000-4000-8000-000000000001', 'Rohan Sharma',  '+91 98765 10001', 'SALES',          true),
  ('a1000002-0000-4000-8000-000000000002', 'Priya Nair',    '+91 98765 10002', 'ACCOUNTS',       true),
  ('a1000003-0000-4000-8000-000000000003', 'Vikram Patel',  '+91 98765 10003', 'SITE_EXECUTION', true),
  ('a1000004-0000-4000-8000-000000000004', 'Meena Joshi',   '+91 98765 10004', 'STORE_PURCHASE', true),
  ('a1000005-0000-4000-8000-000000000005', 'Arun Iyer',     '+91 98765 10005', 'DESIGN',         true),
  ('a1000006-0000-4000-8000-000000000006', 'Kavita Desai',  '+91 98765 10006', 'LIAISONING',     true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  active = EXCLUDED.active;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 ─ PROJECTS (one per key pipeline stage for full coverage)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.projects (
  id, client_name, address, phone, category, kw_required,
  sanctioned_load, connection_number,
  lead_owner_id, stage, quotation_amount, quotation_sent_at,
  payment_status, payment_collected_at, payment_collected_by_id,
  director_approved_at, director_approved_by_id,
  lead_source, temperature, expected_close_date,
  created_at, updated_at
)
VALUES
  -- 1. Fresh LEAD
  (
    'b1000001-0000-4000-8000-000000000001',
    'Suresh Mehta', '12, Patel Nagar, Surat, Gujarat',
    '+91 97250 11001', 'RESIDENTIAL_BUNGALOW', 5.0,
    '5 kW', NULL,
    'a1000001-0000-4000-8000-000000000001', 'LEAD',
    NULL, NULL, 'PENDING', NULL, NULL, NULL, NULL,
    'REFERRAL', 'HOT', CURRENT_DATE + 30,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
  ),
  -- 2. SITE_SURVEY_SCHEDULED
  (
    'b1000002-0000-4000-8000-000000000002',
    'Anjali Kapoor', '45 Silver Oak Residency, Vadodara',
    '+91 97250 11002', 'RESIDENTIAL_FLAT', 3.0,
    '3 kW', NULL,
    'a1000001-0000-4000-8000-000000000001', 'SITE_SURVEY_SCHEDULED',
    NULL, NULL, 'PENDING', NULL, NULL, NULL, NULL,
    'PAID_ADS', 'WARM', CURRENT_DATE + 20,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
  ),
  -- 3. SITE_SURVEY_DONE (design pending)
  (
    'b1000003-0000-4000-8000-000000000003',
    'Ramesh Industries', 'Plot 7, GIDC Estate, Ankleshwar',
    '+91 97250 11003', 'INDUSTRIAL', 25.0,
    '30 kW', 'CONN-2024-0081',
    'a1000001-0000-4000-8000-000000000001', 'SITE_SURVEY_DONE',
    NULL, NULL, 'PENDING', NULL, NULL, NULL, NULL,
    'CAMPAIGN', 'HOT', CURRENT_DATE + 15,
    NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'
  ),
  -- 4. DESIGN_UPLOADED
  (
    'b1000004-0000-4000-8000-000000000004',
    'Kishore Bungalow', '8, Gulmohar Park, Ahmedabad',
    '+91 97250 11004', 'RESIDENTIAL_BUNGALOW', 7.5,
    '8 kW', NULL,
    'a1000001-0000-4000-8000-000000000001', 'DESIGN_UPLOADED',
    NULL, NULL, 'PENDING', NULL, NULL, NULL, NULL,
    'REFERRAL', 'WARM', CURRENT_DATE + 25,
    NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'
  ),
  -- 5. QUOTATION_SENT
  (
    'b1000005-0000-4000-8000-000000000005',
    'Bhatt Enterprises', 'Unit 3, Sachin GIDC, Surat',
    '+91 97250 11005', 'COMMERCIAL', 15.0,
    '20 kW', 'CONN-2024-0095',
    'a1000001-0000-4000-8000-000000000001', 'QUOTATION_SENT',
    412500.00, NOW() - INTERVAL '8 days',
    'PENDING', NULL, NULL, NULL, NULL,
    'WALK_IN', 'WARM', CURRENT_DATE + 10,
    NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days'
  ),
  -- 6. STALE (quotation gone cold)
  (
    'b1000006-0000-4000-8000-000000000006',
    'Deepak Solanki', '22, Rajhans Complex, Nadiad',
    '+91 97250 11006', 'RESIDENTIAL_FLAT', 2.0,
    '2 kW', NULL,
    'a1000001-0000-4000-8000-000000000001', 'STALE',
    55000.00, NOW() - INTERVAL '20 days',
    'PENDING', NULL, NULL, NULL, NULL,
    'COLD_OUTREACH', 'COLD', CURRENT_DATE - 5,
    NOW() - INTERVAL '35 days', NOW() - INTERVAL '20 days'
  ),
  -- 7. PAYMENT_COLLECTED → awaiting director approval
  (
    'b1000007-0000-4000-8000-000000000007',
    'Nirmala Housing Society', 'Block C, Nirmala Society, Rajkot',
    '+91 97250 11007', 'RESIDENTIAL_BUNGALOW', 10.0,
    '10 kW', 'CONN-2024-0110',
    'a1000001-0000-4000-8000-000000000001', 'PAYMENT_COLLECTED',
    275000.00, NOW() - INTERVAL '25 days',
    'COLLECTED', NOW() - INTERVAL '3 days',
    'a1000002-0000-4000-8000-000000000002',
    NULL, NULL,
    'REFERRAL', 'HOT', CURRENT_DATE + 5,
    NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'
  ),
  -- 8. DIRECTOR_APPROVED → BOM & execution queue
  (
    'b1000008-0000-4000-8000-000000000008',
    'Jain Villa', 'Villa 12, Green Meadows, Surat',
    '+91 97250 11008', 'RESIDENTIAL_BUNGALOW', 8.0,
    '8 kW', 'CONN-2024-0112',
    'a1000001-0000-4000-8000-000000000001', 'DIRECTOR_APPROVED',
    220000.00, NOW() - INTERVAL '30 days',
    'COLLECTED', NOW() - INTERVAL '10 days',
    'a1000002-0000-4000-8000-000000000002',
    NOW() - INTERVAL '7 days', '24be7984-4c2f-4437-8e79-b55b7108cef9',
    'REFERRAL', 'HOT', CURRENT_DATE - 2,
    NOW() - INTERVAL '50 days', NOW() - INTERVAL '7 days'
  ),
  -- 9. EXECUTION_IN_PROGRESS (no CEI needed, kW ≤ 10)
  (
    'b1000009-0000-4000-8000-000000000009',
    'Patel Farmhouse', 'Survey No. 45, Olpad, Surat',
    '+91 97250 11009', 'RESIDENTIAL_BUNGALOW', 6.0,
    '6 kW', 'CONN-2024-0085',
    'a1000001-0000-4000-8000-000000000001', 'EXECUTION_IN_PROGRESS',
    165000.00, NOW() - INTERVAL '45 days',
    'COLLECTED', NOW() - INTERVAL '20 days',
    'a1000002-0000-4000-8000-000000000002',
    NOW() - INTERVAL '18 days', '24be7984-4c2f-4437-8e79-b55b7108cef9',
    'REFERRAL', 'HOT', CURRENT_DATE - 15,
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '18 days'
  ),
  -- 10. EXECUTION_COMPLETE → liaisoning
  (
    'b1000010-0000-4000-8000-000000000010',
    'Sharma Clinic', 'Shop 5, Medical Hub, Bharuch',
    '+91 97250 11010', 'COMMERCIAL', 5.0,
    '6 kW', 'CONN-2024-0072',
    'a1000001-0000-4000-8000-000000000001', 'LIAISONING_IN_PROGRESS',
    138000.00, NOW() - INTERVAL '55 days',
    'COLLECTED', NOW() - INTERVAL '35 days',
    'a1000002-0000-4000-8000-000000000002',
    NOW() - INTERVAL '30 days', '24be7984-4c2f-4437-8e79-b55b7108cef9',
    'REFERRAL', 'HOT', CURRENT_DATE - 25,
    NOW() - INTERVAL '70 days', NOW() - INTERVAL '30 days'
  ),
  -- 11. CEI_IN_PROGRESS (kW > 10)
  (
    'b1000011-0000-4000-8000-000000000011',
    'Kotak Textile Mills', 'Plot 18, Pandesara Industrial Zone, Surat',
    '+91 97250 11011', 'INDUSTRIAL', 50.0,
    '60 kW', 'CONN-2024-0068',
    'a1000001-0000-4000-8000-000000000001', 'CEI_IN_PROGRESS',
    1375000.00, NOW() - INTERVAL '65 days',
    'COLLECTED', NOW() - INTERVAL '40 days',
    'a1000002-0000-4000-8000-000000000002',
    NOW() - INTERVAL '35 days', '24be7984-4c2f-4437-8e79-b55b7108cef9',
    'GOVT_TENDER', 'HOT', CURRENT_DATE - 30,
    NOW() - INTERVAL '80 days', NOW() - INTERVAL '35 days'
  ),
  -- 12. CONNECTED (project completed)
  (
    'b1000012-0000-4000-8000-000000000012',
    'Modi Agro Farms', 'Khasra 112, Kamrej Taluka, Surat',
    '+91 97250 11012', 'COMMERCIAL', 10.0,
    '10 kW', 'CONN-2024-0050',
    'a1000001-0000-4000-8000-000000000001', 'CONNECTED',
    275000.00, NOW() - INTERVAL '90 days',
    'COLLECTED', NOW() - INTERVAL '75 days',
    'a1000002-0000-4000-8000-000000000002',
    NOW() - INTERVAL '70 days', '24be7984-4c2f-4437-8e79-b55b7108cef9',
    'REFERRAL', 'HOT', CURRENT_DATE - 60,
    NOW() - INTERVAL '100 days', NOW() - INTERVAL '60 days'
  )
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 ─ SITE SURVEYS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.site_surveys (id, project_id, no_of_panels, physical_measurement,
  photo_urls, diagram_urls, gps_location, contacted_person, surveyed_by_id, surveyed_at)
VALUES
  ('c1000003-0000-4000-8000-000000000001', 'b1000003-0000-4000-8000-000000000003',
    46, 'Rooftop: 35m x 18m flat RCC, South-West orientation, shadow-free',
    ARRAY['https://placehold.co/800x600/png?text=Survey+Photo+1', 'https://placehold.co/800x600/png?text=Survey+Photo+2'],
    ARRAY['https://placehold.co/800x600/png?text=Diagram+1'],
    '21.2514° N, 72.9921° E', 'Mr. Harish Gupta (Plant Manager)', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '8 days'),
  ('c1000003-0000-4000-8000-000000000002', 'b1000004-0000-4000-8000-000000000004',
    13, 'Rooftop: 12m x 9m, pitched tile roof, South orientation',
    ARRAY['https://placehold.co/800x600/png?text=Roof+Photo+1'],
    ARRAY['https://placehold.co/800x600/png?text=Roof+Diagram'],
    '23.0225° N, 72.5714° E', 'Mrs. Bhavna Kishore', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '12 days'),
  ('c1000003-0000-4000-8000-000000000003', 'b1000005-0000-4000-8000-000000000005',
    28, 'Industrial shed roof: 40m x 20m, Metal sheet, South facing',
    ARRAY['https://placehold.co/800x600/png?text=Shed+Photo'],
    ARRAY['https://placehold.co/800x600/png?text=Shed+Diagram'],
    '21.1521° N, 72.7944° E', 'Mr. Kantilal Bhatt', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '18 days'),
  ('c1000003-0000-4000-8000-000000000004', 'b1000007-0000-4000-8000-000000000007',
    18, 'Society terrace: 20m x 15m, flat RCC', ARRAY['https://placehold.co/800x600/png?text=Society+Terrace'], '{}',
    '22.3039° N, 70.8022° E', 'Mr. Rajnish Shah (Secretary)', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '38 days'),
  ('c1000003-0000-4000-8000-000000000005', 'b1000008-0000-4000-8000-000000000008',
    15, 'Villa rooftop: 15m x 10m, South-East', ARRAY['https://placehold.co/800x600/png?text=Villa+Roof'], '{}',
    '21.1702° N, 72.8311° E', 'Mr. Dilip Jain', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '46 days'),
  ('c1000003-0000-4000-8000-000000000006', 'b1000009-0000-4000-8000-000000000009',
    11, 'Farmhouse shed top: 18m x 12m, South', ARRAY['https://placehold.co/800x600/png?text=Farmhouse+Shed'], '{}',
    '21.3500° N, 72.7700° E', 'Mr. Vipul Patel', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '57 days'),
  ('c1000003-0000-4000-8000-000000000007', 'b1000010-0000-4000-8000-000000000010',
    10, 'Clinic building terrace: 10m x 9m, RCC flat', ARRAY['https://placehold.co/800x600/png?text=Clinic+Roof'], '{}',
    '21.7051° N, 73.0024° E', 'Dr. Ramesh Sharma', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '67 days'),
  ('c1000003-0000-4000-8000-000000000008', 'b1000011-0000-4000-8000-000000000011',
    91, 'Mill rooftop: 80m x 40m, RCC industrial', ARRAY['https://placehold.co/800x600/png?text=Mill+Roof+1', 'https://placehold.co/800x600/png?text=Mill+Roof+2'], '{}',
    '21.1644° N, 72.8093° E', 'Mr. Dinesh Kotak (MD)', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '77 days'),
  ('c1000003-0000-4000-8000-000000000009', 'b1000012-0000-4000-8000-000000000012',
    18, 'Farm warehouse top: 22m x 16m, South', ARRAY['https://placehold.co/800x600/png?text=Farm+Roof'], '{}',
    '21.3800° N, 72.6900° E', 'Mr. Ashok Modi', 'a1000003-0000-4000-8000-000000000003',
    NOW() - INTERVAL '97 days')
ON CONFLICT (project_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 ─ DESIGN FILES
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.design_files (id, project_id, type, file_url, version, uploaded_by_id, uploaded_at)
VALUES
  ('d1000001-0000-4000-8000-000000000001', 'b1000004-0000-4000-8000-000000000004',
    'INITIAL', 'https://placehold.co/1200x900/png?text=CAD+Layout+v1+Kishore', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '11 days'),
  ('d1000001-0000-4000-8000-000000000002', 'b1000005-0000-4000-8000-000000000005',
    'INITIAL', 'https://placehold.co/1200x900/png?text=CAD+Layout+Bhatt+v1', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '17 days'),
  ('d1000001-0000-4000-8000-000000000003', 'b1000008-0000-4000-8000-000000000008',
    'INITIAL', 'https://placehold.co/1200x900/png?text=Jain+Villa+SLD+v1', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '44 days'),
  ('d1000001-0000-4000-8000-000000000004', 'b1000009-0000-4000-8000-000000000009',
    'INITIAL', 'https://placehold.co/1200x900/png?text=Patel+Farmhouse+SLD', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '55 days'),
  ('d1000001-0000-4000-8000-000000000005', 'b1000010-0000-4000-8000-000000000010',
    'INITIAL', 'https://placehold.co/1200x900/png?text=Sharma+Clinic+SLD', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '64 days'),
  ('d1000001-0000-4000-8000-000000000006', 'b1000011-0000-4000-8000-000000000011',
    'INITIAL', 'https://placehold.co/1200x900/png?text=Kotak+Textile+SLD+v1', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '74 days'),
  ('d1000001-0000-4000-8000-000000000007', 'b1000011-0000-4000-8000-000000000011',
    'CEI_DRAWING', 'https://placehold.co/1200x900/png?text=Kotak+CEI+Drawing+v1', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '40 days'),
  ('d1000001-0000-4000-8000-000000000008', 'b1000012-0000-4000-8000-000000000012',
    'INITIAL', 'https://placehold.co/1200x900/png?text=Modi+Agro+SLD+v1', 1,
    'a1000005-0000-4000-8000-000000000005', NOW() - INTERVAL '88 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 ─ QUOTATIONS (versioned)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.quotations DISABLE TRIGGER trg_sync_latest_quotation;

INSERT INTO public.quotations (id, project_id, version, line_items, total_amount, sent_at, created_by_id)
VALUES
  ('e1000001-0000-4000-8000-000000000001', 'b1000005-0000-4000-8000-000000000005', 1,
    '[{"item":"15kW Solar System Package","qty":1,"unit_price":412500}]'::jsonb,
    412500.00, NOW() - INTERVAL '8 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000002', 'b1000006-0000-4000-8000-000000000006', 1,
    '[{"item":"2kW Rooftop Solar System","qty":1,"unit_price":55000}]'::jsonb,
    55000.00, NOW() - INTERVAL '20 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000003', 'b1000007-0000-4000-8000-000000000007', 1,
    '[{"item":"10kW Grid-Tie System","qty":1,"unit_price":275000}]'::jsonb,
    275000.00, NOW() - INTERVAL '25 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000004', 'b1000008-0000-4000-8000-000000000008', 1,
    '[{"item":"8kW Grid-Tie Solar System","qty":1,"unit_price":220000}]'::jsonb,
    220000.00, NOW() - INTERVAL '30 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000005', 'b1000009-0000-4000-8000-000000000009', 1,
    '[{"item":"6kW Residential Solar Package","qty":1,"unit_price":165000}]'::jsonb,
    165000.00, NOW() - INTERVAL '45 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000006', 'b1000010-0000-4000-8000-000000000010', 1,
    '[{"item":"5kW Commercial Rooftop System","qty":1,"unit_price":138000}]'::jsonb,
    138000.00, NOW() - INTERVAL '55 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000007', 'b1000011-0000-4000-8000-000000000011', 1,
    '[{"item":"50kW Industrial Ground-Mount System","qty":1,"unit_price":1375000}]'::jsonb,
    1375000.00, NOW() - INTERVAL '65 days', 'a1000001-0000-4000-8000-000000000001'),
  ('e1000001-0000-4000-8000-000000000008', 'b1000012-0000-4000-8000-000000000012', 1,
    '[{"item":"10kW Agro-Commercial Rooftop System","qty":1,"unit_price":275000}]'::jsonb,
    275000.00, NOW() - INTERVAL '90 days', 'a1000001-0000-4000-8000-000000000001')
ON CONFLICT (project_id, version) DO NOTHING;

ALTER TABLE public.quotations ENABLE TRIGGER trg_sync_latest_quotation;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 ─ FOLLOW-UP LOGS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.follow_up_logs (id, project_id, reminder_sent_at, assigned_to_id, acknowledged)
VALUES
  ('f1000001-0000-4000-8000-000000000001', 'b1000005-0000-4000-8000-000000000005',
    NOW() - INTERVAL '8 days', 'a1000001-0000-4000-8000-000000000001', false),
  ('f1000001-0000-4000-8000-000000000002', 'b1000005-0000-4000-8000-000000000005',
    NOW() - INTERVAL '5 days', 'a1000001-0000-4000-8000-000000000001', true),
  ('f1000001-0000-4000-8000-000000000003', 'b1000006-0000-4000-8000-000000000006',
    NOW() - INTERVAL '20 days', 'a1000001-0000-4000-8000-000000000001', false),
  ('f1000001-0000-4000-8000-000000000004', 'b1000006-0000-4000-8000-000000000006',
    NOW() - INTERVAL '17 days', 'a1000001-0000-4000-8000-000000000001', false),
  ('f1000001-0000-4000-8000-000000000005', 'b1000006-0000-4000-8000-000000000006',
    NOW() - INTERVAL '14 days', 'a1000001-0000-4000-8000-000000000001', false)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7 ─ LEAD ACTIVITIES (Valid hex prefixes: 11000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.lead_activities (id, project_id, type, content, call_outcome, created_by_id)
VALUES
  ('11000001-0000-4000-8000-000000000001', 'b1000001-0000-4000-8000-000000000001',
    'CALL', 'Spoke to client. Very interested in 5kW rooftop system. Site visit scheduled for next week.', 'POSITIVE', 'a1000001-0000-4000-8000-000000000001'),
  ('11000001-0000-4000-8000-000000000002', 'b1000001-0000-4000-8000-000000000001',
    'NOTE', 'Client mentioned he has a south-facing terrace, ideal for rooftop install.', NULL, 'a1000001-0000-4000-8000-000000000001'),
  ('11000001-0000-4000-8000-000000000003', 'b1000002-0000-4000-8000-000000000002',
    'MEETING', 'Site visit meeting held at client residence. Measurements taken.', NULL, 'a1000001-0000-4000-8000-000000000001'),
  ('11000001-0000-4000-8000-000000000004', 'b1000005-0000-4000-8000-000000000005',
    'CALL', 'Followed up on quotation. Client reviewing with finance team.', 'NEUTRAL', 'a1000001-0000-4000-8000-000000000001'),
  ('11000001-0000-4000-8000-000000000005', 'b1000006-0000-4000-8000-000000000006',
    'CALL', 'Client not reachable. Left voicemail.', 'NO_ANSWER', 'a1000001-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 8 ─ DOCUMENT CHECKLIST ITEMS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.document_checklist_items (project_id, document_name, required, uploaded, file_url)
VALUES
  ('b1000007-0000-4000-8000-000000000007', 'Electricity Bill (latest)', true, true, 'https://placehold.co/400x600/png?text=EB+Bill'),
  ('b1000007-0000-4000-8000-000000000007', 'Aadhar Card', true, true, 'https://placehold.co/400x600/png?text=Aadhar'),
  ('b1000007-0000-4000-8000-000000000007', 'Roof Ownership Proof', true, false, NULL),
  ('b1000008-0000-4000-8000-000000000008', 'Electricity Bill (latest)', true, true, 'https://placehold.co/400x600/png?text=EB+Bill'),
  ('b1000008-0000-4000-8000-000000000008', 'Aadhar Card', true, true, 'https://placehold.co/400x600/png?text=Aadhar'),
  ('b1000008-0000-4000-8000-000000000008', 'Roof Ownership Proof', true, true, 'https://placehold.co/400x600/png?text=Ownership'),
  ('b1000011-0000-4000-8000-000000000011', 'Electricity Bill (latest)', true, true, 'https://placehold.co/400x600/png?text=EB+Bill'),
  ('b1000011-0000-4000-8000-000000000011', 'GST Certificate', true, true, 'https://placehold.co/400x600/png?text=GST+Cert'),
  ('b1000011-0000-4000-8000-000000000011', 'Industrial License', true, true, 'https://placehold.co/400x600/png?text=Ind+License'),
  ('b1000011-0000-4000-8000-000000000011', 'Load Sanction Letter', true, false, NULL)
ON CONFLICT (project_id, document_name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 9 ─ LABOUR TEAMS (Prefix: 21000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.labour_teams (id, name, headcount, available)
VALUES
  ('21000001-0000-4000-8000-000000000001', 'Team Alpha — Surat North', 6, true),
  ('21000001-0000-4000-8000-000000000002', 'Team Beta — Surat South', 5, false),
  ('21000001-0000-4000-8000-000000000003', 'Team Gamma — Vadodara', 7, true),
  ('21000001-0000-4000-8000-000000000004', 'Team Delta — Ankleshwar', 4, true)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 10 ─ LABOUR ASSIGNMENTS (Prefix: 31000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.labour_assignments (id, labour_team_id, project_id, stage, assigned_date)
VALUES
  ('31000001-0000-4000-8000-000000000001',
    '21000001-0000-4000-8000-000000000001', 'b1000009-0000-4000-8000-000000000009',
    'STRUCTURE_FABRICATION', CURRENT_DATE - 15),
  ('31000001-0000-4000-8000-000000000002',
    '21000001-0000-4000-8000-000000000001', 'b1000009-0000-4000-8000-000000000009',
    'PANEL', CURRENT_DATE - 12),
  ('31000001-0000-4000-8000-000000000003',
    '21000001-0000-4000-8000-000000000002', 'b1000009-0000-4000-8000-000000000009',
    'WIRING', CURRENT_DATE - 8),
  ('31000001-0000-4000-8000-000000000004',
    '21000001-0000-4000-8000-000000000003', 'b1000008-0000-4000-8000-000000000008',
    'STRUCTURE_FABRICATION', CURRENT_DATE - 5)
ON CONFLICT (labour_team_id, assigned_date) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 11 ─ EXECUTION STAGE PROGRESS (Prefix: 41000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.execution_stage_progress (id, project_id, stage, photo_url, comment, completed_at, completed_by_id)
VALUES
  ('41000001-0000-4000-8000-000000000001', 'b1000009-0000-4000-8000-000000000009',
    'STRUCTURE_FABRICATION', 'https://placehold.co/800x600/png?text=Structure+Done',
    'GI structure welded and mounted on terrace anchors. Quality checked.', NOW() - INTERVAL '13 days',
    'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000002', 'b1000009-0000-4000-8000-000000000009',
    'PANEL', 'https://placehold.co/800x600/png?text=Panels+Installed',
    '11 panels (545W each) installed and clipped. Torque verified at 40 Nm.', NOW() - INTERVAL '10 days',
    'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000003', 'b1000009-0000-4000-8000-000000000009',
    'WIRING', 'https://placehold.co/800x600/png?text=Wiring+Done',
    'DC wiring complete. MC4 connectors verified. ACDB/DCDB mounted.', NOW() - INTERVAL '6 days',
    'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000004', 'b1000012-0000-4000-8000-000000000012',
    'STRUCTURE_FABRICATION', 'https://placehold.co/800x600/png?text=Modi+Structure',
    'Structure complete.', NOW() - INTERVAL '68 days', 'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000005', 'b1000012-0000-4000-8000-000000000012',
    'PANEL', 'https://placehold.co/800x600/png?text=Modi+Panels',
    'All 18 panels installed.', NOW() - INTERVAL '65 days', 'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000006', 'b1000012-0000-4000-8000-000000000012',
    'WIRING', 'https://placehold.co/800x600/png?text=Modi+Wiring',
    'Wiring and earthing complete.', NOW() - INTERVAL '63 days', 'a1000003-0000-4000-8000-000000000003'),
  ('41000001-0000-4000-8000-000000000007', 'b1000012-0000-4000-8000-000000000012',
    'CIVIL', 'https://placehold.co/800x600/png?text=Modi+Civil',
    'Civil and grouting works done.', NOW() - INTERVAL '61 days', 'a1000003-0000-4000-8000-000000000003')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 12 ─ EXECUTION COMPLETIONS (Prefix: 51000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.execution_completions (id, project_id, panel_serial_numbers, panel_count, inverter_serial_number, captured_via, completed_at)
VALUES
  ('51000001-0000-4000-8000-000000000001', 'b1000010-0000-4000-8000-000000000010',
    ARRAY['PNL-545-A0001', 'PNL-545-A0002', 'PNL-545-A0003', 'PNL-545-A0004', 'PNL-545-A0005',
          'PNL-545-A0006', 'PNL-545-A0007', 'PNL-545-A0008', 'PNL-545-A0009', 'PNL-545-A0010'],
    10, 'INV-GRW-3KW-B0042', 'SCAN', NOW() - INTERVAL '32 days'),
  ('51000001-0000-4000-8000-000000000002', 'b1000011-0000-4000-8000-000000000011',
    ARRAY['PNL-545-C0101','PNL-545-C0102','PNL-545-C0103','PNL-545-C0104','PNL-545-C0105',
          'PNL-545-C0106','PNL-545-C0107','PNL-545-C0108','PNL-545-C0109','PNL-545-C0110'],
    91, 'INV-GRW-5KW-C0018', 'SCAN', NOW() - INTERVAL '38 days'),
  ('51000001-0000-4000-8000-000000000003', 'b1000012-0000-4000-8000-000000000012',
    ARRAY['PNL-545-D0201','PNL-545-D0202','PNL-545-D0203','PNL-545-D0204','PNL-545-D0205',
          'PNL-545-D0206','PNL-545-D0207','PNL-545-D0208','PNL-545-D0209','PNL-545-D0210',
          'PNL-545-D0211','PNL-545-D0212','PNL-545-D0213','PNL-545-D0214','PNL-545-D0215',
          'PNL-545-D0216','PNL-545-D0217','PNL-545-D0218'],
    18, 'INV-GRW-5KW-D0077', 'SCAN', NOW() - INTERVAL '60 days')
ON CONFLICT (project_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 13 ─ BOMs & BOM ITEMS (Prefix: 61000001-... / 71000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.boms (id, project_id, created_by_id)
VALUES
  ('61000001-0000-4000-8000-000000000001', 'b1000008-0000-4000-8000-000000000008', 'a1000004-0000-4000-8000-000000000004'),
  ('61000001-0000-4000-8000-000000000002', 'b1000009-0000-4000-8000-000000000009', 'a1000004-0000-4000-8000-000000000004'),
  ('61000001-0000-4000-8000-000000000003', 'b1000012-0000-4000-8000-000000000012', 'a1000004-0000-4000-8000-000000000004')
ON CONFLICT (project_id) DO NOTHING;

INSERT INTO public.bom_items (id, bom_id, item_name, category, quantity, unit)
VALUES
  ('71000001-0000-4000-8000-000000000001', '61000001-0000-4000-8000-000000000001', '545W Mono PERC Solar Panel', 'Panels', 15, 'NOS'),
  ('71000001-0000-4000-8000-000000000002', '61000001-0000-4000-8000-000000000001', '8kW 3-Phase Grid-Tie Inverter', 'Inverters', 1, 'NOS'),
  ('71000001-0000-4000-8000-000000000003', '61000001-0000-4000-8000-000000000001', 'HDG Elevated Structure', 'Structures', 2, 'SET'),
  ('71000001-0000-4000-8000-000000000004', '61000001-0000-4000-8000-000000000001', '4mm DC Cable', 'Balance of System', 120, 'MTR'),
  ('71000001-0000-4000-8000-000000000005', '61000001-0000-4000-8000-000000000001', 'ACDB & DCDB Box', 'Balance of System', 1, 'SET'),
  ('71000001-0000-4000-8000-000000000006', '61000001-0000-4000-8000-000000000002', '545W Mono PERC Solar Panel', 'Panels', 11, 'NOS'),
  ('71000001-0000-4000-8000-000000000007', '61000001-0000-4000-8000-000000000002', '5kW 3-Phase Inverter', 'Inverters', 1, 'NOS'),
  ('71000001-0000-4000-8000-000000000008', '61000001-0000-4000-8000-000000000002', 'HDG Elevated Structure', 'Structures', 2, 'SET'),
  ('71000001-0000-4000-8000-000000000009', '61000001-0000-4000-8000-000000000002', '4mm DC Cable', 'Balance of System', 90, 'MTR'),
  ('71000001-0000-4000-8000-000000000010', '61000001-0000-4000-8000-000000000003', '545W Mono PERC Solar Panel', 'Panels', 18, 'NOS'),
  ('71000001-0000-4000-8000-000000000011', '61000001-0000-4000-8000-000000000003', '5kW 3-Phase Inverter', 'Inverters', 2, 'NOS'),
  ('71000001-0000-4000-8000-000000000012', '61000001-0000-4000-8000-000000000003', 'HDG Elevated Structure', 'Structures', 3, 'SET'),
  ('71000001-0000-4000-8000-000000000013', '61000001-0000-4000-8000-000000000003', '4mm DC Cable', 'Balance of System', 160, 'MTR'),
  ('71000001-0000-4000-8000-000000000014', '61000001-0000-4000-8000-000000000003', 'Chemical Earthing Electrode', 'Balance of System', 2, 'SET')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 14 ─ DELIVERY CHALLANS (Prefix: 81000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.delivery_challans (id, project_id, vehicle_type, registration_number, driver_name, driver_mobile, distance, created_by_id)
VALUES
  ('81000001-0000-4000-8000-000000000001', 'b1000009-0000-4000-8000-000000000009',
    'Pickup Truck', 'GJ-05-AJ-7712', 'Bhavesh Chauhan', '+91 94270 22001', 45.5,
    'a1000004-0000-4000-8000-000000000004'),
  ('81000001-0000-4000-8000-000000000002', 'b1000012-0000-4000-8000-000000000012',
    'Mini Truck (Tata Ace)', 'GJ-05-BK-3391', 'Dinesh Rathod', '+91 94270 22002', 62.0,
    'a1000004-0000-4000-8000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 15 ─ STOCK LEDGER (Prefix: 91000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.stock_ledger (id, item_name, direction, quantity, project_id, delivery_challan_id, created_by_id)
VALUES
  ('91000001-0000-4000-8000-000000000001', '545W Mono PERC Solar PV Panels', 'IN', 100, NULL, NULL, 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000002', '5kW 3-Phase Grid-Tie Solar Inverter', 'IN', 10, NULL, NULL, 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000003', 'HDG Elevated High-Rise Structure Rails & Purlins', 'IN', 20, NULL, NULL, 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000004', '4 sq mm 1C Solar DC Cable Red/Black', 'IN', 1000, NULL, NULL, 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000005', 'Chemical Earthing Electrode (2m) & Bentonite Compound', 'IN', 20, NULL, NULL, 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000006', '545W Mono PERC Solar PV Panels', 'OUT', 11,
    'b1000009-0000-4000-8000-000000000009', '81000001-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000007', '5kW 3-Phase Grid-Tie Solar Inverter', 'OUT', 1,
    'b1000009-0000-4000-8000-000000000009', '81000001-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000008', 'HDG Elevated High-Rise Structure Rails & Purlins', 'OUT', 2,
    'b1000009-0000-4000-8000-000000000009', '81000001-0000-4000-8000-000000000001', 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000009', '545W Mono PERC Solar PV Panels', 'OUT', 18,
    'b1000012-0000-4000-8000-000000000012', '81000001-0000-4000-8000-000000000002', 'a1000004-0000-4000-8000-000000000004'),
  ('91000001-0000-4000-8000-000000000010', '5kW 3-Phase Grid-Tie Solar Inverter', 'OUT', 2,
    'b1000012-0000-4000-8000-000000000012', '81000001-0000-4000-8000-000000000002', 'a1000004-0000-4000-8000-000000000004')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 16 ─ PURCHASE ORDERS & GRNs (Prefix: a2000001-... / b2000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_waaree_id    uuid;
  v_growatt_id   uuid;
  v_item_panel   uuid;
  v_item_inv5kw  uuid;
  v_po1_id       uuid := 'a2000001-0000-4000-8000-000000000001';
  v_po2_id       uuid := 'a2000001-0000-4000-8000-000000000002';
  v_po1item1_id  uuid := 'a2000001-0000-4000-8000-000000000011';
  v_po2item1_id  uuid := 'a2000001-0000-4000-8000-000000000021';
  v_grn1_id      uuid := 'b2000001-0000-4000-8000-000000000001';
  v_store_uid    uuid := 'a1000004-0000-4000-8000-000000000004';
BEGIN
  SELECT id INTO v_waaree_id FROM public.suppliers WHERE name ILIKE '%Waaree%' LIMIT 1;
  SELECT id INTO v_growatt_id FROM public.suppliers WHERE name ILIKE '%Growatt%' LIMIT 1;
  SELECT id INTO v_item_panel FROM public.items_master WHERE item_code = 'ITM-PNL-545' LIMIT 1;
  SELECT id INTO v_item_inv5kw FROM public.items_master WHERE item_code = 'ITM-INV-5KW-3P' LIMIT 1;

  IF v_waaree_id IS NOT NULL AND v_item_panel IS NOT NULL THEN
    INSERT INTO public.purchase_orders (id, po_number, supplier_id, status, total_amount, tax_amount, issued_at, created_by_id, notes)
    VALUES (v_po1_id, 'PO-2024-0041', v_waaree_id, 'RECEIVED', 935000.00, 102000.00, NOW() - INTERVAL '25 days', v_store_uid, 'Quarterly panel restock — 110 nos.')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.po_items (id, po_id, item_master_id, item_name, quantity, unit_price, tax_rate, amount, quantity_received)
    VALUES (v_po1item1_id, v_po1_id, v_item_panel, '545W Mono PERC Solar PV Panels', 110, 8500, 12.0, 935000, 110)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.goods_receipt_notes (id, grn_number, po_id, received_date, received_by_id, notes)
    VALUES (v_grn1_id, 'GRN-2024-0038', v_po1_id, CURRENT_DATE - 20, v_store_uid, 'All 110 panels received in good condition. Inspected and stacked.')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.grn_items (grn_id, po_item_id, quantity_received, quantity_rejected, remarks)
    VALUES (v_grn1_id, v_po1item1_id, 110, 0, 'All accepted')
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_growatt_id IS NOT NULL AND v_item_inv5kw IS NOT NULL THEN
    INSERT INTO public.purchase_orders (id, po_number, supplier_id, status, total_amount, tax_amount, issued_at, created_by_id, notes)
    VALUES (v_po2_id, 'PO-2024-0042', v_growatt_id, 'ISSUED', 462000.00, 49714.29, NOW() - INTERVAL '10 days', v_store_uid, '10 nos. 5kW 3-phase inverters for upcoming projects.')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.po_items (id, po_id, item_master_id, item_name, quantity, unit_price, tax_rate, amount, quantity_received)
    VALUES (v_po2item1_id, v_po2_id, v_item_inv5kw, '5kW 3-Phase Grid-Tie Solar Inverter', 10, 42000, 12.0, 420000, 0)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 17 ─ LIAISONING RECORDS (Prefix: c2000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.liaisoning_records (
  id, project_id, documents_received_at, acknowledgement_number,
  govt_estimate_quotation_number, govt_estimate_amount, estimate_paid_at,
  discom_file_ready_at, connected_at, meter_report_url, meter_report_uploaded_at
)
VALUES
  ('c2000001-0000-4000-8000-000000000001', 'b1000010-0000-4000-8000-000000000010',
    NOW() - INTERVAL '28 days', 'PGVCL-ACK-2024-110234',
    'PGVCL-GEQ-2024-00821', 4200.00, NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '15 days', NULL, NULL, NULL),
  ('c2000001-0000-4000-8000-000000000002', 'b1000011-0000-4000-8000-000000000011',
    NOW() - INTERVAL '35 days', 'PGVCL-ACK-2024-109851',
    NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('c2000001-0000-4000-8000-000000000003', 'b1000012-0000-4000-8000-000000000012',
    NOW() - INTERVAL '58 days', 'PGVCL-ACK-2024-105342',
    'PGVCL-GEQ-2024-00701', 3800.00, NOW() - INTERVAL '52 days',
    NOW() - INTERVAL '48 days', NOW() - INTERVAL '61 days',
    'https://placehold.co/800x600/png?text=Meter+Sync+Report',
    NOW() - INTERVAL '60 days')
ON CONFLICT (project_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 18 ─ DISCOM FOLLOW-UP LOGS (Prefix: d2000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.discom_follow_up_logs (id, liaisoning_record_id, follow_up_date, note, logged_by_id)
VALUES
  ('d2000001-0000-4000-8000-000000000001', 'c2000001-0000-4000-8000-000000000001',
    CURRENT_DATE - 25, 'Called PGVCL helpdesk. Application acknowledged. Awaiting inspection date.',
    'a1000006-0000-4000-8000-000000000006'),
  ('d2000001-0000-4000-8000-000000000002', 'c2000001-0000-4000-8000-000000000001',
    CURRENT_DATE - 18, 'Follow-up email sent. Government estimate received (₹4,200). Processing payment.',
    'a1000006-0000-4000-8000-000000000006'),
  ('d2000001-0000-4000-8000-000000000003', 'c2000001-0000-4000-8000-000000000001',
    CURRENT_DATE - 10, 'Government estimate paid online. File submitted for DISCOM processing.',
    'a1000006-0000-4000-8000-000000000006')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 19 ─ CEI RECORDS (Prefix: e2000001-...)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.cei_records (
  id, project_id, self_certificate_generated_at, filed_for_client_signing_at,
  drawing_approval_design_file_id, cei_portal_reference_number,
  cei_approved_at, inspector_name, inspector_date, inspector_contact
)
VALUES
  ('e2000001-0000-4000-8000-000000000001', 'b1000011-0000-4000-8000-000000000011',
    NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days',
    'd1000001-0000-4000-8000-000000000007', 'CEI-GUJ-2024-00441',
    NULL, 'Er. Bhupendra Trivedi (CEI Inspector, Surat Circle)', CURRENT_DATE + 5, '+91 94265 77001')
ON CONFLICT (project_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 20 ─ PROJECT COMMENTS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_comments' AND table_schema = 'public') THEN
    INSERT INTO public.project_comments (project_id, author_id, comment_text)
    VALUES
      ('b1000008-0000-4000-8000-000000000008', '24be7984-4c2f-4437-8e79-b55b7108cef9', 'Approved. Please proceed with execution immediately. Priority project.'),
      ('b1000009-0000-4000-8000-000000000009', 'a1000003-0000-4000-8000-000000000003', 'Wiring stage in progress. Civil stage expected to start in 3 days.'),
      ('b1000011-0000-4000-8000-000000000011', 'a1000006-0000-4000-8000-000000000006', 'CEI inspector visit confirmed for ' || (CURRENT_DATE + 5)::text || '. All drawings are ready.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
