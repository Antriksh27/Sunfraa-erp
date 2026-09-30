-- Migration: 00025_quotations_update_policy.sql
-- Description: Add missing UPDATE policy for quotations table to allow dispatching draft quotations

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotations' AND policyname = 'quotations_update_policy'
  ) THEN
    CREATE POLICY quotations_update_policy ON public.quotations
      FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
