-- Migration: 00010_accounts_depth.sql
-- Description: Adds payment milestones, invoices, aging calculation support, and project payment status rollup

-- 1. Extend payment_status enum with 'PARTIAL'
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'PARTIAL';

-- 2. Create payment_milestones table
CREATE TABLE IF NOT EXISTS public.payment_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  percentage numeric(5, 2) NOT NULL,
  amount numeric(12, 2) NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COLLECTED')),
  collected_at timestamptz,
  payment_mode text CHECK (payment_mode IS NULL OR payment_mode IN ('CASH', 'CHEQUE', 'NEFT', 'UPI')),
  reference_number text,
  receipt_url text,
  collected_by_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_milestones_project_id ON public.payment_milestones (project_id);

ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_milestones' AND policyname = 'milestones_select_policy'
  ) THEN
    CREATE POLICY milestones_select_policy ON public.payment_milestones
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payment_milestones' AND policyname = 'milestones_all_policy'
  ) THEN
    CREATE POLICY milestones_all_policy ON public.payment_milestones
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  invoice_type text NOT NULL DEFAULT 'TAX' CHECK (invoice_type IN ('ADVANCE', 'TAX', 'FINAL')),
  amount numeric(12, 2) NOT NULL,
  gst_rate numeric(5, 2) NOT NULL DEFAULT 13.8,
  gst_amount numeric(12, 2) NOT NULL,
  total_amount numeric(12, 2) NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  created_by_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices (project_id);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_select_policy'
  ) THEN
    CREATE POLICY invoices_select_policy ON public.invoices
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_all_policy'
  ) THEN
    CREATE POLICY invoices_all_policy ON public.invoices
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Rollup trigger to synchronize projects.payment_status based on milestone collection
CREATE OR REPLACE FUNCTION public.sync_project_payment_rollup()
RETURNS trigger AS $$
DECLARE
  v_proj_id uuid;
  v_total_milestones int;
  v_collected_milestones int;
  v_current_stage text;
BEGIN
  v_proj_id := COALESCE(NEW.project_id, OLD.project_id);

  SELECT count(*), count(*) FILTER (WHERE status = 'COLLECTED')
  INTO v_total_milestones, v_collected_milestones
  FROM public.payment_milestones
  WHERE project_id = v_proj_id;

  SELECT stage INTO v_current_stage FROM public.projects WHERE id = v_proj_id;

  IF v_total_milestones > 0 AND v_collected_milestones = v_total_milestones THEN
    UPDATE public.projects
    SET payment_status = 'COLLECTED',
        payment_collected_at = COALESCE(payment_collected_at, now()),
        stage = CASE WHEN stage IN ('LEAD', 'SITE_SURVEY_SCHEDULED', 'SITE_SURVEY_DONE', 'DESIGN_PENDING', 'DESIGN_UPLOADED', 'QUOTATION_SENT', 'STALE') THEN 'PAYMENT_COLLECTED' ELSE stage END,
        updated_at = now()
    WHERE id = v_proj_id;
  ELSIF v_collected_milestones > 0 THEN
    UPDATE public.projects
    SET payment_status = 'PARTIAL',
        updated_at = now()
    WHERE id = v_proj_id;
  ELSIF v_total_milestones > 0 THEN
    UPDATE public.projects
    SET payment_status = 'PENDING',
        updated_at = now()
    WHERE id = v_proj_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_project_payment_rollup ON public.payment_milestones;

CREATE TRIGGER trg_sync_project_payment_rollup
AFTER INSERT OR UPDATE OR DELETE ON public.payment_milestones
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_payment_rollup();
