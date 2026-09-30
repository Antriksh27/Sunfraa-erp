-- Migration: 00029_fix_approval_audit_logs_actor_fkey.sql
-- Description: Point approval_audit_logs(actor_id) to public.profiles(id) so Supabase postgREST can embed actor:profiles(...)

ALTER TABLE public.approval_audit_logs
  DROP CONSTRAINT IF EXISTS approval_audit_logs_actor_id_fkey;

ALTER TABLE public.approval_audit_logs
  ADD CONSTRAINT approval_audit_logs_actor_id_fkey
  FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
