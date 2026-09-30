-- Migration: 00006_execution_triggers.sql
-- Description: Triggers for Director Approval BOM handoff (Business Rule 6) and Execution Completion handoff (Business Rule 9)

-- ============================================================================
-- 1. BOM SHELL AUTO-CREATION TRIGGER (Business Rule 6)
-- On director_approved_at being set, auto-create a BOM shell if none exists
-- ============================================================================

CREATE OR REPLACE FUNCTION on_project_director_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.director_approved_at IS NULL AND NEW.director_approved_at IS NOT NULL) THEN
    -- Ensure stage is set to DIRECTOR_APPROVED
    NEW.stage := 'DIRECTOR_APPROVED';
    NEW.updated_at := NOW();

    -- Auto-create BOM shell in Store & Purchase module
    INSERT INTO public.boms (project_id, created_by_id)
    VALUES (NEW.id, NEW.director_approved_by_id)
    ON CONFLICT (project_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_project_director_approved ON projects;
CREATE TRIGGER trg_on_project_director_approved
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION on_project_director_approved();

-- ============================================================================
-- 2. POST-COMPLETION HANDOFF TRIGGER (Business Rule 9)
-- On ExecutionCompletion creation, advance stage to CEI_IN_PROGRESS or LIAISONING_IN_PROGRESS
-- ============================================================================

CREATE OR REPLACE FUNCTION on_execution_completion_created()
RETURNS TRIGGER AS $$
DECLARE
  v_cei_required BOOLEAN;
BEGIN
  -- Check if project requires CEI (>10kW)
  SELECT cei_required INTO v_cei_required
  FROM public.projects
  WHERE id = NEW.project_id;

  IF (v_cei_required IS TRUE) THEN
    UPDATE public.projects
    SET 
      stage = 'CEI_IN_PROGRESS',
      updated_at = NOW()
    WHERE id = NEW.project_id;

    -- Also instantiate CEIRecord if not already present
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_execution_completion_created ON execution_completions;
CREATE TRIGGER trg_on_execution_completion_created
  AFTER INSERT ON execution_completions
  FOR EACH ROW
  EXECUTE FUNCTION on_execution_completion_created();
