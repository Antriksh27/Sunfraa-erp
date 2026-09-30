-- Migration: 20260915115653_fix_sales_profiles_fkeys.sql
-- Description: Drop auth.users foreign key constraints and recreate them against public.profiles(id)
--              for lead_activities, quotations, project_comments, and reassignment_logs.

-- 1. lead_activities
ALTER TABLE public.lead_activities
  DROP CONSTRAINT IF EXISTS lead_activities_created_by_id_fkey;

ALTER TABLE public.lead_activities
  ADD CONSTRAINT lead_activities_created_by_id_fkey
  FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. quotations
ALTER TABLE public.quotations
  DROP CONSTRAINT IF EXISTS quotations_created_by_id_fkey;

ALTER TABLE public.quotations
  ADD CONSTRAINT quotations_created_by_id_fkey
  FOREIGN KEY (created_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. project_comments
ALTER TABLE public.project_comments
  DROP CONSTRAINT IF EXISTS project_comments_author_id_fkey;

ALTER TABLE public.project_comments
  ADD CONSTRAINT project_comments_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. reassignment_logs (3 columns)
ALTER TABLE public.reassignment_logs
  DROP CONSTRAINT IF EXISTS reassignment_logs_reassigned_from_id_fkey,
  DROP CONSTRAINT IF EXISTS reassignment_logs_reassigned_to_id_fkey,
  DROP CONSTRAINT IF EXISTS reassignment_logs_reassigned_by_id_fkey;

ALTER TABLE public.reassignment_logs
  ADD CONSTRAINT reassignment_logs_reassigned_from_id_fkey
  FOREIGN KEY (reassigned_from_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT reassignment_logs_reassigned_to_id_fkey
  FOREIGN KEY (reassigned_to_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD CONSTRAINT reassignment_logs_reassigned_by_id_fkey
  FOREIGN KEY (reassigned_by_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
