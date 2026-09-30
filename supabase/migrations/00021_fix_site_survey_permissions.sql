-- Migration: 00021_fix_site_survey_permissions.sql
-- Description:
-- 1. Restrict INSERT/UPDATE/DELETE on site_surveys to ('SITE_EXECUTION', 'DIRECTOR') only.
-- 2. Scope SELECT on site_surveys for SALES to their own leads (projects.lead_owner_id = auth.uid()).
-- 3. Add survey scheduling fields to projects (survey_scheduled_date, survey_assigned_engineer_id).

-- 1. Add survey scheduling fields to projects if not exists
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS survey_scheduled_date date,
  ADD COLUMN IF NOT EXISTS survey_assigned_engineer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_survey_assigned_engineer 
  ON public.projects(survey_assigned_engineer_id);

-- 2. Drop existing site_surveys policies
DROP POLICY IF EXISTS "site_surveys_select" ON public.site_surveys;
DROP POLICY IF EXISTS "site_surveys_write" ON public.site_surveys;
DROP POLICY IF EXISTS "site_surveys_select_scoped" ON public.site_surveys;
DROP POLICY IF EXISTS "site_surveys_insert_execution_director" ON public.site_surveys;
DROP POLICY IF EXISTS "site_surveys_update_execution_director" ON public.site_surveys;
DROP POLICY IF EXISTS "site_surveys_delete_execution_director" ON public.site_surveys;

-- 3. SELECT: Scoped for SALES to their own leads, open to other execution/management roles
CREATE POLICY "site_surveys_select_scoped"
  ON public.site_surveys FOR SELECT
  USING (
    auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'DESIGN', 'ACCOUNTS', 'STORE_PURCHASE', 'LIAISONING')
    OR (
      auth_role() = 'SALES' AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = site_surveys.project_id
        AND projects.lead_owner_id = auth.uid()
      )
    )
  );

-- 4. INSERT: Strictly restricted to SITE_EXECUTION and DIRECTOR
CREATE POLICY "site_surveys_insert_execution_director"
  ON public.site_surveys FOR INSERT
  WITH CHECK (
    auth_role() IN ('SITE_EXECUTION', 'DIRECTOR')
  );

-- 5. UPDATE: Strictly restricted to SITE_EXECUTION and DIRECTOR
CREATE POLICY "site_surveys_update_execution_director"
  ON public.site_surveys FOR UPDATE
  USING (
    auth_role() IN ('SITE_EXECUTION', 'DIRECTOR')
  )
  WITH CHECK (
    auth_role() IN ('SITE_EXECUTION', 'DIRECTOR')
  );

-- 6. DELETE: Strictly restricted to SITE_EXECUTION and DIRECTOR
CREATE POLICY "site_surveys_delete_execution_director"
  ON public.site_surveys FOR DELETE
  USING (
    auth_role() IN ('SITE_EXECUTION', 'DIRECTOR')
  );
