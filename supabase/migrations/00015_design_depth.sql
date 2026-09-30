-- Migration: 00015_design_depth.sql
-- Description: Adds expanded design file types, version notes, CEI review checklist, SLD builder specs, and design revision status

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE design_system_type AS ENUM (
    'STRING_INVERTER',
    'MICRO_INVERTER',
    'HYBRID'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE design_review_status AS ENUM (
    'PENDING',
    'APPROVED',
    'NEEDS_REVISION'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Extend design_files table
ALTER TABLE public.design_files
  ADD COLUMN IF NOT EXISTS version_notes text,
  ADD COLUMN IF NOT EXISTS status design_review_status DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS revision_comments text;

-- 3. Create CEI Drawing Review Checklist table
CREATE TABLE IF NOT EXISTS public.cei_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  earthing_pit_verified boolean NOT NULL DEFAULT false,
  lightning_arrestor_verified boolean NOT NULL DEFAULT false,
  transformer_ht_attached boolean NOT NULL DEFAULT false,
  cei_fee_challan_attached boolean NOT NULL DEFAULT false,
  verified_by_id uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cei_checklists ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cei_checklists' AND policyname = 'cei_checklists_select_policy'
  ) THEN
    CREATE POLICY cei_checklists_select_policy ON public.cei_checklists
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cei_checklists' AND policyname = 'cei_checklists_all_policy'
  ) THEN
    CREATE POLICY cei_checklists_all_policy ON public.cei_checklists
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Create SLD Builder Specifications table
CREATE TABLE IF NOT EXISTS public.sld_specifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  system_type design_system_type NOT NULL DEFAULT 'STRING_INVERTER',
  inverter_kw numeric(6, 2) NOT NULL,
  panel_count integer NOT NULL,
  string_count integer NOT NULL,
  dc_cable_length_m numeric(8, 2) NOT NULL,
  ac_cable_length_m numeric(8, 2) NOT NULL,
  created_by_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sld_specifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sld_specifications' AND policyname = 'sld_specifications_select_policy'
  ) THEN
    CREATE POLICY sld_specifications_select_policy ON public.sld_specifications
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sld_specifications' AND policyname = 'sld_specifications_all_policy'
  ) THEN
    CREATE POLICY sld_specifications_all_policy ON public.sld_specifications
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
