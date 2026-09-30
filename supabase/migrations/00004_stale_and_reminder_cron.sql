-- Migration: 00004_stale_and_reminder_cron.sql
-- Description: Scheduled database routines for 15-day stale quotations (Business Rule 1) and 3-day follow-up reminders (Business Rule 2)

-- ============================================================================
-- 1. STALE QUOTATIONS ROUTINE (Business Rule 1)
-- If stage = QUOTATION_SENT and now() - quotation_sent_at > 15 days, set stage = STALE
-- ============================================================================

CREATE OR REPLACE FUNCTION process_stale_quotations()
RETURNS void AS $$
BEGIN
  UPDATE projects
  SET 
    stage = 'STALE',
    updated_at = NOW()
  WHERE 
    stage = 'QUOTATION_SENT'
    AND quotation_sent_at IS NOT NULL
    AND quotation_sent_at < NOW() - INTERVAL '15 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. SALES REMINDER CADENCE ROUTINE (Business Rule 2)
-- If stage = QUOTATION_SENT, create a FollowUpLog every 3 days from quotation_sent_at
-- ============================================================================

CREATE OR REPLACE FUNCTION process_quotation_follow_ups()
RETURNS void AS $$
BEGIN
  INSERT INTO follow_up_logs (project_id, reminder_sent_at, assigned_to_id, acknowledged)
  SELECT 
    p.id,
    NOW(),
    p.lead_owner_id,
    FALSE
  FROM projects p
  WHERE 
    p.stage = 'QUOTATION_SENT'
    AND p.lead_owner_id IS NOT NULL
    AND p.quotation_sent_at IS NOT NULL
    -- Either no reminder exists yet and 3 days have elapsed since quote sent...
    -- Or 3 days have elapsed since the most recent reminder log
    AND (
      (
        NOT EXISTS (SELECT 1 FROM follow_up_logs f WHERE f.project_id = p.id)
        AND p.quotation_sent_at < NOW() - INTERVAL '3 days'
      )
      OR (
        EXISTS (
          SELECT 1 FROM follow_up_logs f 
          WHERE f.project_id = p.id 
          GROUP BY f.project_id 
          HAVING MAX(f.reminder_sent_at) < NOW() - INTERVAL '3 days'
        )
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
