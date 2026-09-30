-- Migration: 00018_project_comments.sql
-- Description: Adds project_comments table for threaded cross-module discussions and @mentions

CREATE TABLE IF NOT EXISTS public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id),
  comment_text text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  mentioned_user_ids uuid[] DEFAULT '{}',
  parent_comment_id uuid REFERENCES public.project_comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments (project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_parent_id ON public.project_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_pinned ON public.project_comments (is_pinned);

ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_comments' AND policyname = 'project_comments_select_policy'
  ) THEN
    CREATE POLICY project_comments_select_policy ON public.project_comments
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'project_comments' AND policyname = 'project_comments_all_policy'
  ) THEN
    CREATE POLICY project_comments_all_policy ON public.project_comments
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
