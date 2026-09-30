-- Migration: 00009_sales_pipeline_depth.sql
-- Description: Adds lead intake extensions, duplicate detection support, lead activities, document checklists, and quotations versioning

-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM (
    'REFERRAL',
    'PAID_ADS',
    'CAMPAIGN',
    'WALK_IN',
    'GOVT_TENDER',
    'COLD_OUTREACH'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_temperature AS ENUM (
    'HOT',
    'WARM',
    'COLD'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_lost_reason AS ENUM (
    'PRICE',
    'COMPETITOR',
    'PROJECT_SHELVED',
    'FINANCING_FELL_THROUGH',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_activity_type AS ENUM (
    'NOTE',
    'CALL',
    'MEETING'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Extend projects table with new intake and lost tracking columns
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS lead_source lead_source DEFAULT 'REFERRAL',
  ADD COLUMN IF NOT EXISTS source_detail text,
  ADD COLUMN IF NOT EXISTS temperature lead_temperature DEFAULT 'WARM',
  ADD COLUMN IF NOT EXISTS expected_close_date date,
  ADD COLUMN IF NOT EXISTS lost_reason lead_lost_reason,
  ADD COLUMN IF NOT EXISTS lost_competitor_name text,
  ADD COLUMN IF NOT EXISTS lost_at timestamptz;

-- 3. Create lead_activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type lead_activity_type NOT NULL DEFAULT 'NOTE',
  content text NOT NULL,
  call_outcome text,
  created_by_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_project_id ON public.lead_activities (project_id);

ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'lead_activities_select_policy'
  ) THEN
    CREATE POLICY lead_activities_select_policy ON public.lead_activities
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = lead_activities.project_id
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'lead_activities_insert_policy'
  ) THEN
    CREATE POLICY lead_activities_insert_policy ON public.lead_activities
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lead_activities' AND policyname = 'lead_activities_delete_policy'
  ) THEN
    CREATE POLICY lead_activities_delete_policy ON public.lead_activities
      FOR DELETE USING (auth.uid() = created_by_id);
  END IF;
END $$;

-- 4. Create document_checklist_items table
CREATE TABLE IF NOT EXISTS public.document_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  uploaded boolean NOT NULL DEFAULT false,
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_document_name UNIQUE (project_id, document_name)
);

CREATE INDEX IF NOT EXISTS idx_document_checklist_project_id ON public.document_checklist_items (project_id);

ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_checklist_items' AND policyname = 'doc_checklist_select_policy'
  ) THEN
    CREATE POLICY doc_checklist_select_policy ON public.document_checklist_items
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'document_checklist_items' AND policyname = 'doc_checklist_all_policy'
  ) THEN
    CREATE POLICY doc_checklist_all_policy ON public.document_checklist_items
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. Create quotations versioning table
CREATE TABLE IF NOT EXISTS public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric(12, 2) NOT NULL,
  sent_at timestamptz DEFAULT now(),
  created_by_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_quotation_version UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS idx_quotations_project_id ON public.quotations (project_id);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'quotations_select_policy'
  ) THEN
    CREATE POLICY quotations_select_policy ON public.quotations
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'quotations_insert_policy'
  ) THEN
    CREATE POLICY quotations_insert_policy ON public.quotations
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 6. Trigger to automatically sync latest quotation version to projects table
CREATE OR REPLACE FUNCTION public.sync_latest_quotation_amount()
RETURNS trigger AS $$
BEGIN
  UPDATE public.projects
  SET quotation_amount = NEW.total_amount,
      quotation_sent_at = COALESCE(NEW.sent_at, now()),
      stage = 'QUOTATION_SENT',
      updated_at = now()
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_latest_quotation ON public.quotations;

CREATE TRIGGER trg_sync_latest_quotation
AFTER INSERT ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.sync_latest_quotation_amount();
