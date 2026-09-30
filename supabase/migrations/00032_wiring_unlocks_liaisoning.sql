-- Migration: 00032_wiring_unlocks_liaisoning.sql
-- Description: Unlocks government liaisoning (CEI_IN_PROGRESS / LIAISONING_IN_PROGRESS) at WIRING stage sign-off

-- 1. Remove stage transition from execution_completions
DROP TRIGGER IF EXISTS trg_on_execution_completion_created ON public.execution_completions;

CREATE OR REPLACE FUNCTION public.on_execution_completion_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Execution completion dossier is now strictly informational/record-keeping
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger on execution_stage_progress: advance stage to CEI or Liaisoning when WIRING is signed off
CREATE OR REPLACE FUNCTION public.on_execution_wiring_stage_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_cei_required BOOLEAN;
BEGIN
  IF NEW.stage = 'WIRING' THEN
    SELECT cei_required INTO v_cei_required
    FROM public.projects
    WHERE id = NEW.project_id;

    IF (v_cei_required IS TRUE) THEN
      UPDATE public.projects
      SET 
        stage = 'CEI_IN_PROGRESS',
        updated_at = NOW()
      WHERE id = NEW.project_id;

      -- Instantiate CEIRecord if not already present
      INSERT INTO public.cei_records (project_id)
      VALUES (NEW.project_id)
      ON CONFLICT (project_id) DO NOTHING;
    ELSE
      UPDATE public.projects
      SET 
        stage = 'LIAISONING_IN_PROGRESS',
        updated_at = NOW()
      WHERE id = NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_execution_wiring_stage_completed ON public.execution_stage_progress;
CREATE TRIGGER trg_on_execution_wiring_stage_completed
  AFTER INSERT ON public.execution_stage_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.on_execution_wiring_stage_completed();

-- 3. Ensure SITE_EXECUTION can insert into cei_records if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cei_records' AND policyname = 'cei_records_execution_insert'
  ) THEN
    CREATE POLICY "cei_records_execution_insert"
      ON public.cei_records FOR INSERT
      WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'LIAISONING'));
  END IF;
END $$;
