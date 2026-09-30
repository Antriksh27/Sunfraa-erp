-- Migration: 00023_quotation_status_and_trigger_gate.sql
-- Description:
-- 1. Adds 'status' column to quotations ('DRAFT', 'SENT', 'APPROVED', 'REJECTED') defaulting to 'SENT' for backwards compatibility.
-- 2. Modifies sync_latest_quotation_amount trigger function to only fire project updates when status IN ('SENT', 'APPROVED').
--    Bare DRAFT quotations will NOT modify projects.quotation_amount, quotation_sent_at, or stage (preventing premature stale/reminder clocks).

-- 1. Add status column to quotations if it doesn't exist (backfill existing as 'SENT', future default 'DRAFT')
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'quotations' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.quotations 
      ADD COLUMN status text NOT NULL DEFAULT 'DRAFT' 
      CHECK (status IN ('DRAFT', 'SENT', 'APPROVED', 'REJECTED'));
  ELSE
    ALTER TABLE public.quotations 
      ALTER COLUMN status SET DEFAULT 'DRAFT';
  END IF;
END $$;

-- 2. Update trigger function to gate project updates
CREATE OR REPLACE FUNCTION public.sync_latest_quotation_amount()
RETURNS trigger AS $$
BEGIN
  -- Gate: only update projects when quotation is dispatched (SENT) or approved
  IF NEW.status IN ('SENT', 'APPROVED') THEN
    UPDATE public.projects
    SET quotation_amount = NEW.total_amount,
        quotation_sent_at = COALESCE(NEW.sent_at, now()),
        stage = CASE 
          WHEN stage IN ('LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'STALE') 
          THEN 'QUOTATION_SENT' 
          ELSE stage 
        END,
        updated_at = now()
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to fire on INSERT OR UPDATE OF status, total_amount, sent_at
DROP TRIGGER IF EXISTS trg_sync_latest_quotation ON public.quotations;

CREATE TRIGGER trg_sync_latest_quotation
AFTER INSERT OR UPDATE OF status, total_amount, sent_at ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.sync_latest_quotation_amount();
