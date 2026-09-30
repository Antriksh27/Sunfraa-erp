-- Migration: 00028_fix_cross_module_project_update_policies.sql
-- Description: Allow SITE_EXECUTION, DESIGN, and LIAISONING to update projects table for valid workflow transitions
-- (e.g. stage updates, connection numbers, equipment specifications) while preserving the trigger guards
-- for payment_status and director_approved_at.

CREATE POLICY "projects_update_execution"
  ON public.projects FOR UPDATE
  USING (auth_role() IN ('SITE_EXECUTION'))
  WITH CHECK (auth_role() IN ('SITE_EXECUTION'));

CREATE POLICY "projects_update_design"
  ON public.projects FOR UPDATE
  USING (auth_role() IN ('DESIGN'))
  WITH CHECK (auth_role() IN ('DESIGN'));

CREATE POLICY "projects_update_liaisoning"
  ON public.projects FOR UPDATE
  USING (auth_role() IN ('LIAISONING'))
  WITH CHECK (auth_role() IN ('LIAISONING'));
