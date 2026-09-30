-- Migration: 00008_notification_reads.sql
-- Description: Table and RLS policies for tracking read notifications per user

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_key text NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_notification_reads_user_key UNIQUE (user_id, notification_key)
);

-- Index for fast lookups by user and notification key
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_key ON public.notification_reads (user_id, notification_key);

-- Enable RLS
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users manage only their own notification reads
CREATE POLICY "Users can view their own notification reads"
  ON public.notification_reads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification reads"
  ON public.notification_reads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification reads"
  ON public.notification_reads
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification reads"
  ON public.notification_reads
  FOR DELETE
  USING (auth.uid() = user_id);
