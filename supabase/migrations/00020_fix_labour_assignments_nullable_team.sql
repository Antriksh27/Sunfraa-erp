-- Migration: 00020_fix_labour_assignments_nullable_team.sql
-- Description: Allows labour_team_id to be NULL when assigning an external subcontractor, adds check constraint and subcontractor conflict index.

ALTER TABLE public.labour_assignments 
  ALTER COLUMN labour_team_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'labour_assignment_team_or_subcontractor'
  ) THEN
    ALTER TABLE public.labour_assignments 
      ADD CONSTRAINT labour_assignment_team_or_subcontractor 
      CHECK (labour_team_id IS NOT NULL OR subcontractor_id IS NOT NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_labour_assignment_subcontractor_date 
  ON public.labour_assignments (subcontractor_id, assigned_date) 
  WHERE subcontractor_id IS NOT NULL;
