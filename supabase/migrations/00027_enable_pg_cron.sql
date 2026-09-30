-- =============================================================================
-- Migration: 00027_enable_pg_cron.sql
-- Description: Enable pg_cron extension and schedule background routines
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 1. Schedule daily stale quotations processor at 01:00 UTC
SELECT cron.schedule(
  'daily-stale-quotations',
  '0 1 * * *',
  'SELECT public.process_stale_quotations();'
);

-- 2. Schedule daily quotation follow-up reminder generator at 02:00 UTC
SELECT cron.schedule(
  'daily-quotation-follow-ups',
  '0 2 * * *',
  'SELECT public.process_quotation_follow_ups();'
);
