-- Migration: 00017_manager_control.sql
-- Description: Adds reassignment audit logs table and indexes for manager control

CREATE TABLE IF NOT EXISTS public.reassignment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reassigned_from_id uuid REFERENCES auth.users(id),
  reassigned_to_id uuid NOT NULL REFERENCES auth.users(id),
  reassignment_reason text NOT NULL,
  reassigned_by_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reassignment_logs_project_id ON public.reassignment_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_logs_reassigned_to ON public.reassignment_logs (reassigned_to_id);

ALTER TABLE public.reassignment_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reassignment_logs' AND policyname = 'reassignment_logs_select_policy'
  ) THEN
    CREATE POLICY reassignment_logs_select_policy ON public.reassignment_logs
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'reassignment_logs' AND policyname = 'reassignment_logs_all_policy'
  ) THEN
    CREATE POLICY reassignment_logs_all_policy ON public.reassignment_logs
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
