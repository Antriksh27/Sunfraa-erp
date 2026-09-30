-- Migration: 00022_audit_fixes_and_discom_scope.sql
-- Description: 
-- 1. Restricts payment_milestones RLS to ACCOUNTS and DIRECTOR only.
-- 2. Updates on_project_payment_collected trigger to handle transitions from PARTIAL to COLLECTED.
-- 3. Adds portal_other_name to discom_portal_records for custom/other DISCOM names.

-- ============================================================================
-- 1. PAYMENT MILESTONES RLS RE-ENFORCEMENT
-- ============================================================================

-- Drop the overly-permissive policy that allowed any authenticated user to modify milestones
DROP POLICY IF EXISTS milestones_all_policy ON public.payment_milestones;

-- Ensure SELECT is permitted for authenticated users
DROP POLICY IF EXISTS milestones_select_policy ON public.payment_milestones;
CREATE POLICY milestones_select_policy ON public.payment_milestones
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Restrict INSERT, UPDATE, and DELETE strictly to ACCOUNTS and DIRECTOR roles
DROP POLICY IF EXISTS milestones_modify_policy ON public.payment_milestones;
CREATE POLICY milestones_modify_policy ON public.payment_milestones
  FOR ALL
  USING (auth_role() IN ('ACCOUNTS', 'DIRECTOR'))
  WITH CHECK (auth_role() IN ('ACCOUNTS', 'DIRECTOR'));

-- ============================================================================
-- 2. PAYMENT COLLECTION TRIGGER: FIX FOR PARTIAL -> COLLECTED TRANSITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.on_project_payment_collected()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status transitions to COLLECTED from either PENDING or PARTIAL
  IF (OLD.payment_status IS DISTINCT FROM 'COLLECTED' AND NEW.payment_status = 'COLLECTED') THEN
    -- 1. Set payment timestamp if not already provided
    NEW.payment_collected_at := COALESCE(NEW.payment_collected_at, NOW());

    -- 2. Advance stage to PAYMENT_COLLECTED if in an earlier pipeline stage
    IF NEW.stage IN ('LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE') THEN
      NEW.stage := 'PAYMENT_COLLECTED';
    END IF;
    NEW.updated_at := NOW();

    -- 3. Automatically instantiate the 1:1 LiaisoningRecord (Business Rule 12)
    INSERT INTO public.liaisoning_records (project_id)
    VALUES (NEW.id)
    ON CONFLICT (project_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. DISCOM SCOPE ENHANCEMENT: FREE-TEXT SUPPORT FOR OTHER DISCOMS
-- ============================================================================

ALTER TABLE public.discom_portal_records
  ADD COLUMN IF NOT EXISTS portal_other_name text;
