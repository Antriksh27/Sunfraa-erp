-- Migration: 00002_rls_policies.sql
-- Description: Row Level Security (RLS) helper and comprehensive policies for all 7 roles

-- ============================================================================
-- 1. AUTH ROLE HELPER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION auth_role() RETURNS text AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() AND active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 2. ENABLE RLS ON ALL 16 TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE labour_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE liaisoning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE discom_follow_up_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cei_records ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. PROFILES POLICIES
-- ============================================================================

CREATE POLICY "profiles_select_authenticated"
  ON profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_director_manage"
  ON profiles FOR ALL
  USING (auth_role() = 'DIRECTOR')
  WITH CHECK (auth_role() = 'DIRECTOR');

-- ============================================================================
-- 4. PROJECTS POLICIES & ENFORCEMENT
-- ============================================================================

CREATE POLICY "projects_select_scoped"
  ON projects FOR SELECT
  USING (
    auth_role() IN ('DIRECTOR', 'ACCOUNTS', 'STORE_PURCHASE', 'SITE_EXECUTION', 'DESIGN', 'LIAISONING')
    OR (auth_role() = 'SALES' AND lead_owner_id = auth.uid())
  );

CREATE POLICY "projects_insert_sales_director"
  ON projects FOR INSERT
  WITH CHECK (
    auth_role() = 'DIRECTOR'
    OR (auth_role() = 'SALES' AND lead_owner_id = auth.uid())
  );

CREATE POLICY "projects_update_director"
  ON projects FOR UPDATE
  USING (auth_role() = 'DIRECTOR')
  WITH CHECK (auth_role() = 'DIRECTOR');

CREATE POLICY "projects_update_accounts"
  ON projects FOR UPDATE
  USING (auth_role() = 'ACCOUNTS')
  WITH CHECK (auth_role() = 'ACCOUNTS');

CREATE POLICY "projects_update_sales_own"
  ON projects FOR UPDATE
  USING (auth_role() = 'SALES' AND lead_owner_id = auth.uid())
  WITH CHECK (auth_role() = 'SALES' AND lead_owner_id = auth.uid());

-- Trigger to guard payment and approval fields against unauthorized mutations (Business Rule 4 & 5)
CREATE OR REPLACE FUNCTION check_project_field_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF (auth_role() NOT IN ('DIRECTOR', 'ACCOUNTS')) THEN
    IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
        OLD.payment_collected_at IS DISTINCT FROM NEW.payment_collected_at OR
        OLD.payment_collected_by_id IS DISTINCT FROM NEW.payment_collected_by_id) THEN
      RAISE EXCEPTION 'Only ACCOUNTS or DIRECTOR can modify payment fields.';
    END IF;
  END IF;

  IF (auth_role() != 'DIRECTOR') THEN
    IF (OLD.director_approved_at IS DISTINCT FROM NEW.director_approved_at OR
        OLD.director_approved_by_id IS DISTINCT FROM NEW.director_approved_by_id) THEN
      RAISE EXCEPTION 'Only DIRECTOR can approve projects for execution.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_project_field_permissions
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION check_project_field_permissions();

-- ============================================================================
-- 5. SITE SURVEYS POLICIES
-- ============================================================================

CREATE POLICY "site_surveys_select"
  ON site_surveys FOR SELECT
  USING (
    auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'SALES', 'DESIGN', 'ACCOUNTS')
  );

CREATE POLICY "site_surveys_write"
  ON site_surveys FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

-- ============================================================================
-- 6. DESIGN FILES POLICIES
-- ============================================================================

CREATE POLICY "design_files_select"
  ON design_files FOR SELECT
  USING (
    auth_role() IN ('DIRECTOR', 'DESIGN', 'SALES', 'LIAISONING')
  );

CREATE POLICY "design_files_write"
  ON design_files FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'DESIGN'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'DESIGN'));

-- ============================================================================
-- 7. BOMS & BOM ITEMS POLICIES
-- ============================================================================

CREATE POLICY "boms_select"
  ON boms FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'SITE_EXECUTION'));

CREATE POLICY "boms_write"
  ON boms FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

CREATE POLICY "bom_items_select"
  ON bom_items FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'SITE_EXECUTION'));

CREATE POLICY "bom_items_write"
  ON bom_items FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

-- ============================================================================
-- 8. STORE & PURCHASE (CHALLANS & LEDGER) POLICIES
-- ============================================================================

CREATE POLICY "delivery_challans_select"
  ON delivery_challans FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

CREATE POLICY "delivery_challans_write"
  ON delivery_challans FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

CREATE POLICY "stock_ledger_select"
  ON stock_ledger FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

CREATE POLICY "stock_ledger_write"
  ON stock_ledger FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE'));

-- ============================================================================
-- 9. LABOUR & EXECUTION POLICIES
-- ============================================================================

CREATE POLICY "labour_teams_select"
  ON labour_teams FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "labour_teams_write"
  ON labour_teams FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "labour_assignments_select"
  ON labour_assignments FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "labour_assignments_write"
  ON labour_assignments FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "execution_progress_select"
  ON execution_stage_progress FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "execution_progress_write"
  ON execution_stage_progress FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "execution_completions_select"
  ON execution_completions FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

CREATE POLICY "execution_completions_write"
  ON execution_completions FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION'));

-- ============================================================================
-- 10. SALES FOLLOW UP LOGS POLICIES
-- ============================================================================

CREATE POLICY "follow_up_logs_select"
  ON follow_up_logs FOR SELECT
  USING (
    auth_role() = 'DIRECTOR'
    OR (auth_role() = 'SALES' AND assigned_to_id = auth.uid())
  );

CREATE POLICY "follow_up_logs_write"
  ON follow_up_logs FOR ALL
  USING (
    auth_role() = 'DIRECTOR'
    OR (auth_role() = 'SALES' AND assigned_to_id = auth.uid())
  )
  WITH CHECK (
    auth_role() = 'DIRECTOR'
    OR (auth_role() = 'SALES' AND assigned_to_id = auth.uid())
  );

-- ============================================================================
-- 11. LIAISONING & CEI POLICIES
-- ============================================================================

CREATE POLICY "liaisoning_records_select"
  ON liaisoning_records FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'));

CREATE POLICY "liaisoning_records_write"
  ON liaisoning_records FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'LIAISONING'));

CREATE POLICY "discom_follow_up_logs_select"
  ON discom_follow_up_logs FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'));

CREATE POLICY "discom_follow_up_logs_write"
  ON discom_follow_up_logs FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'LIAISONING'));

CREATE POLICY "cei_records_select"
  ON cei_records FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'));

CREATE POLICY "cei_records_write"
  ON cei_records FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'LIAISONING'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'LIAISONING'));
