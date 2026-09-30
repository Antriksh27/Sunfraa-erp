-- Migration: 00005_payment_collection_trigger.sql
-- Description: Postgres trigger to advance project stage and auto-create LiaisoningRecord upon payment collection (Business Rules 4 & 12)

-- ============================================================================
-- 1. PAYMENT COLLECTION TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION on_project_payment_collected()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status transitions to COLLECTED
  IF (OLD.payment_status = 'PENDING' AND NEW.payment_status = 'COLLECTED') THEN
    -- 1. Set payment timestamp if not already provided
    NEW.payment_collected_at := COALESCE(NEW.payment_collected_at, NOW());

    -- 2. Advance stage to PAYMENT_COLLECTED
    NEW.stage := 'PAYMENT_COLLECTED';
    NEW.updated_at := NOW();

    -- 3. Automatically instantiate the 1:1 LiaisoningRecord (Business Rule 12)
    INSERT INTO public.liaisoning_records (project_id)
    VALUES (NEW.id)
    ON CONFLICT (project_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution before project update
DROP TRIGGER IF EXISTS trg_on_project_payment_collected ON projects;
CREATE TRIGGER trg_on_project_payment_collected
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION on_project_payment_collected();
