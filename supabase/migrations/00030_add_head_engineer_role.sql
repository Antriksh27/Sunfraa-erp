-- Migration: 00030_add_head_engineer_role.sql
-- Description: Add HEAD_ENGINEER role to user_role enum and grant read access to projects, boms, bom_items, execution progress & labour tables

-- 1. Add enum value
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'HEAD_ENGINEER';

-- 2. Update projects read policy
DROP POLICY IF EXISTS "projects_select_scoped" ON projects;
CREATE POLICY "projects_select_scoped"
  ON projects FOR SELECT
  USING (
    auth_role() IN ('DIRECTOR', 'ACCOUNTS', 'STORE_PURCHASE', 'SITE_EXECUTION', 'DESIGN', 'LIAISONING', 'HEAD_ENGINEER')
    OR (auth_role() = 'SALES' AND lead_owner_id = auth.uid())
  );

-- 3. Update boms read policy
DROP POLICY IF EXISTS "boms_select" ON boms;
CREATE POLICY "boms_select"
  ON boms FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 4. Update bom_items read policy
DROP POLICY IF EXISTS "bom_items_select" ON bom_items;
CREATE POLICY "bom_items_select"
  ON bom_items FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 5. Update execution_stage_progress read policy
DROP POLICY IF EXISTS "execution_progress_select" ON execution_stage_progress;
CREATE POLICY "execution_progress_select"
  ON execution_stage_progress FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 6. Update execution_completions read policy
DROP POLICY IF EXISTS "execution_completions_select" ON execution_completions;
CREATE POLICY "execution_completions_select"
  ON execution_completions FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 7. Update labour_teams read policy
DROP POLICY IF EXISTS "labour_teams_select" ON labour_teams;
CREATE POLICY "labour_teams_select"
  ON labour_teams FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 8. Update labour_assignments read policy
DROP POLICY IF EXISTS "labour_assignments_select" ON labour_assignments;
CREATE POLICY "labour_assignments_select"
  ON labour_assignments FOR SELECT
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'));
