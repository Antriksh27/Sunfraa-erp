-- Migration: 00007_saved_views.sql
-- Description: Creates the saved_views table and RLS policies for per-user custom list views

CREATE TABLE IF NOT EXISTS public.saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name text NOT NULL,
  view_name text NOT NULL,
  filter_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_saved_views_user_module_name UNIQUE (user_id, module_name, view_name)
);

-- Index for quick lookups by user and module
CREATE INDEX IF NOT EXISTS idx_saved_views_user_module ON public.saved_views (user_id, module_name);

-- Enable RLS
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users manage only their own saved views
CREATE POLICY "Users can view their own saved views"
  ON public.saved_views
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved views"
  ON public.saved_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved views"
  ON public.saved_views
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved views"
  ON public.saved_views
  FOR DELETE
  USING (auth.uid() = user_id);
