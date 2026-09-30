-- Migration: 00003_storage_buckets.sql
-- Description: Setup Supabase Storage buckets and role-based storage policies

-- ============================================================================
-- 1. CREATE STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('site-survey-photos', 'site-survey-photos', true),
  ('design-files', 'design-files', true),
  ('delivery-challans', 'delivery-challans', true),
  ('meter-reports', 'meter-reports', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ============================================================================
-- 2. STORAGE POLICIES: site-survey-photos
-- ============================================================================

CREATE POLICY "site_survey_photos_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'site-survey-photos'
    AND auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'SALES', 'DESIGN', 'ACCOUNTS')
  );

CREATE POLICY "site_survey_photos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-survey-photos'
    AND auth_role() IN ('DIRECTOR', 'SITE_EXECUTION')
  );

-- ============================================================================
-- 3. STORAGE POLICIES: design-files
-- ============================================================================

CREATE POLICY "design_files_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design-files'
    AND auth_role() IN ('DIRECTOR', 'DESIGN', 'SALES', 'LIAISONING')
  );

CREATE POLICY "design_files_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design-files'
    AND auth_role() IN ('DIRECTOR', 'DESIGN')
  );

-- ============================================================================
-- 4. STORAGE POLICIES: delivery-challans
-- ============================================================================

CREATE POLICY "delivery_challans_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'delivery-challans'
    AND auth_role() IN ('DIRECTOR', 'STORE_PURCHASE')
  );

CREATE POLICY "delivery_challans_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'delivery-challans'
    AND auth_role() IN ('DIRECTOR', 'STORE_PURCHASE')
  );

-- ============================================================================
-- 5. STORAGE POLICIES: meter-reports
-- ============================================================================

CREATE POLICY "meter_reports_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'meter-reports'
    AND auth_role() IN ('DIRECTOR', 'LIAISONING', 'ACCOUNTS')
  );

CREATE POLICY "meter_reports_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'meter-reports'
    AND auth_role() IN ('DIRECTOR', 'LIAISONING')
  );
