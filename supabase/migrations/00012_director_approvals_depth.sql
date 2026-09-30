-- Migration: 00012_director_approvals_depth.sql
-- Description: Adds approval audit logs, rejection reasons, and batch approval audit support

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE director_approval_action AS ENUM (
    'APPROVED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE director_rejection_reason AS ENUM (
    'LOW_MARGIN',
    'HIGH_RISK',
    'INCOMPLETE_DATA',
    'CAPACITY_OVERLOAD',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Extend projects table with rejection tracking
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS last_rejected_reason director_rejection_reason,
  ADD COLUMN IF NOT EXISTS last_rejected_notes text,
  ADD COLUMN IF NOT EXISTS last_rejected_at timestamptz;

-- 3. Create approval_audit_logs table
CREATE TABLE IF NOT EXISTS public.approval_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action director_approval_action NOT NULL,
  actor_id uuid NOT NULL REFERENCES auth.users(id),
  reason director_rejection_reason,
  notes text,
  estimated_margin numeric(6, 2),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_audit_logs_project_id ON public.approval_audit_logs (project_id);

ALTER TABLE public.approval_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_audit_logs' AND policyname = 'approval_audit_select_policy'
  ) THEN
    CREATE POLICY approval_audit_select_policy ON public.approval_audit_logs
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'approval_audit_logs' AND policyname = 'approval_audit_insert_policy'
  ) THEN
    CREATE POLICY approval_audit_insert_policy ON public.approval_audit_logs
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
