-- Migration: 00011_execution_depth.sql
-- Description: Adds subcontractors master, extends labour assignments, stage signoffs, and handover packet support

-- 1. Create subcontractors table
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade text NOT NULL CHECK (trade IN ('STRUCTURE', 'PANEL', 'WIRING', 'CIVIL', 'ALL')),
  phone text NOT NULL,
  rate_type text NOT NULL CHECK (rate_type IN ('PER_KW', 'PER_DAY', 'LUMPSUM')),
  default_rate numeric(10, 2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subcontractors_active ON public.subcontractors (is_active);

ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subcontractors' AND policyname = 'subcontractors_select_policy'
  ) THEN
    CREATE POLICY subcontractors_select_policy ON public.subcontractors
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subcontractors' AND policyname = 'subcontractors_all_policy'
  ) THEN
    CREATE POLICY subcontractors_all_policy ON public.subcontractors
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 2. Extend labour_assignments with subcontractor reference, headcount, and notes
ALTER TABLE public.labour_assignments
  ADD COLUMN IF NOT EXISTS subcontractor_id uuid REFERENCES public.subcontractors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS headcount integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS rate numeric(10, 2),
  ADD COLUMN IF NOT EXISTS total_cost numeric(12, 2);

-- 3. Extend execution_stage_progress with multiple photos array support
ALTER TABLE public.execution_stage_progress
  ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS started_at timestamptz DEFAULT now();

-- 4. Seed initial default subcontractors
INSERT INTO public.subcontractors (name, trade, phone, rate_type, default_rate, is_active)
VALUES
  ('Apex Solar Erectors & Fabricators', 'STRUCTURE', '+91 98250 11223', 'PER_KW', 450.00, true),
  ('SunPower Panel Mounting Crew', 'PANEL', '+91 98250 44556', 'PER_KW', 350.00, true),
  ('Shreeji AC/DC Electrical Contractors', 'WIRING', '+91 98250 77889', 'PER_DAY', 2500.00, true),
  ('Gujarat Civil & Foundation Works', 'CIVIL', '+91 98250 99001', 'LUMPSUM', 15000.00, true),
  ('Unified Solar Turnkey EPC Team', 'ALL', '+91 98250 33445', 'PER_KW', 1200.00, true)
ON CONFLICT DO NOTHING;
