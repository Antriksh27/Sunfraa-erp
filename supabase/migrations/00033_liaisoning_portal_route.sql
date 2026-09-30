-- Migration: 00033_liaisoning_portal_route.sql
-- Description: Adds portal_route and subsidy_type to liaisoning_records with commercial defaulting

-- 1. Add columns with check constraints
ALTER TABLE public.liaisoning_records
  ADD COLUMN IF NOT EXISTS portal_route text 
    CHECK (portal_route IN ('NATIONAL_PORTAL_SUBSIDY', 'NATIONAL_PORTAL_NON_SUBSIDY', 'GEDA_PORTAL')),
  ADD COLUMN IF NOT EXISTS subsidy_type text 
    CHECK (subsidy_type IN ('COMMON_SUBSIDY', 'INDIVIDUAL_SUBSIDY', 'NON_SUBSIDY'));

-- 2. Trigger function to default COMMERCIAL/INDUSTRIAL projects to GEDA_PORTAL
CREATE OR REPLACE FUNCTION public.set_default_liaisoning_portal_route()
RETURNS TRIGGER AS $$
DECLARE
  v_category project_category;
BEGIN
  IF NEW.portal_route IS NULL THEN
    SELECT category INTO v_category
    FROM public.projects
    WHERE id = NEW.project_id;

    IF v_category IN ('COMMERCIAL', 'INDUSTRIAL') THEN
      NEW.portal_route := 'GEDA_PORTAL';
    END IF;
    -- For RESIDENTIAL_BUNGALOW and RESIDENTIAL_FLAT: leave portal_route as NULL
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_default_liaisoning_portal_route ON public.liaisoning_records;
CREATE TRIGGER trg_set_default_liaisoning_portal_route
  BEFORE INSERT ON public.liaisoning_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_liaisoning_portal_route();

-- 3. Backfill existing commercial/industrial liaisoning records if unset
UPDATE public.liaisoning_records lr
SET portal_route = 'GEDA_PORTAL'
FROM public.projects p
WHERE lr.project_id = p.id
  AND p.category IN ('COMMERCIAL', 'INDUSTRIAL')
  AND lr.portal_route IS NULL;
