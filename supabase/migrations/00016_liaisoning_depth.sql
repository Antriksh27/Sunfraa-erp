-- Migration: 00016_liaisoning_depth.sql
-- Description: Adds DISCOM portal tracker with query SLAs, CEI inspector logs, meter test records, and subsidy release tracking

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE discom_portal_name AS ENUM (
    'TORRENT_POWER',
    'UGVCL',
    'PGVCL',
    'MGVCL',
    'DGVCL',
    'BESCOM',
    'TSSPDCL',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE discom_app_status AS ENUM (
    'APPLIED',
    'QUERY_RAISED',
    'APPROVED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subsidy_claim_status AS ENUM (
    'CLAIMED',
    'INSPECTED',
    'DISBURSED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create discom_portal_records table
CREATE TABLE IF NOT EXISTS public.discom_portal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  portal_name discom_portal_name NOT NULL DEFAULT 'TORRENT_POWER',
  application_number text NOT NULL,
  ack_receipt_url text,
  applied_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  query_raised_at timestamptz,
  query_resolved_at timestamptz,
  query_text text,
  status discom_app_status NOT NULL DEFAULT 'APPLIED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discom_portal_records_project_id ON public.discom_portal_records (project_id);

ALTER TABLE public.discom_portal_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discom_portal_records' AND policyname = 'discom_portal_records_select_policy'
  ) THEN
    CREATE POLICY discom_portal_records_select_policy ON public.discom_portal_records
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'discom_portal_records' AND policyname = 'discom_portal_records_all_policy'
  ) THEN
    CREATE POLICY discom_portal_records_all_policy ON public.discom_portal_records
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Create cei_inspector_logs table
CREATE TABLE IF NOT EXISTS public.cei_inspector_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspector_name text NOT NULL,
  inspector_phone text,
  scheduled_date date NOT NULL,
  visit_completed boolean NOT NULL DEFAULT false,
  report_notes text,
  certificate_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cei_inspector_logs_project_id ON public.cei_inspector_logs (project_id);

ALTER TABLE public.cei_inspector_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cei_inspector_logs' AND policyname = 'cei_inspector_logs_select_policy'
  ) THEN
    CREATE POLICY cei_inspector_logs_select_policy ON public.cei_inspector_logs
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cei_inspector_logs' AND policyname = 'cei_inspector_logs_all_policy'
  ) THEN
    CREATE POLICY cei_inspector_logs_all_policy ON public.cei_inspector_logs
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Create meter_test_records table
CREATE TABLE IF NOT EXISTS public.meter_test_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  meter_serial_number text NOT NULL,
  ct_pt_ratio text,
  test_report_number text NOT NULL,
  test_date date NOT NULL DEFAULT CURRENT_DATE,
  passed boolean NOT NULL DEFAULT true,
  test_report_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meter_test_records_project_id ON public.meter_test_records (project_id);

ALTER TABLE public.meter_test_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meter_test_records' AND policyname = 'meter_test_records_select_policy'
  ) THEN
    CREATE POLICY meter_test_records_select_policy ON public.meter_test_records
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'meter_test_records' AND policyname = 'meter_test_records_all_policy'
  ) THEN
    CREATE POLICY meter_test_records_all_policy ON public.meter_test_records
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. Create subsidy_claims table
CREATE TABLE IF NOT EXISTS public.subsidy_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  consumer_number text,
  national_portal_app_no text NOT NULL,
  subsidy_amount numeric(10, 2) NOT NULL DEFAULT 0,
  claim_submitted_at date NOT NULL DEFAULT CURRENT_DATE,
  inspected_at date,
  disbursed_at date,
  utr_number text,
  status subsidy_claim_status NOT NULL DEFAULT 'CLAIMED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subsidy_claims_project_id ON public.subsidy_claims (project_id);

ALTER TABLE public.subsidy_claims ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subsidy_claims' AND policyname = 'subsidy_claims_select_policy'
  ) THEN
    CREATE POLICY subsidy_claims_select_policy ON public.subsidy_claims
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subsidy_claims' AND policyname = 'subsidy_claims_all_policy'
  ) THEN
    CREATE POLICY subsidy_claims_all_policy ON public.subsidy_claims
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
