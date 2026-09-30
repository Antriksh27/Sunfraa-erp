-- =============================================================================
-- Migration: 00025_remove_demo_accounts.sql
-- Description: Reassign all demo project/workflow history to real Sunfraa team
--              and safely remove the 7 placeholder demo accounts.
-- =============================================================================

DO $$
DECLARE
  v_demo_ids uuid[] := ARRAY[
    '24be7984-4c2f-4437-8e79-b55b7108cef9'::uuid, -- Super Admin (DIRECTOR)
    'a1000001-0000-4000-8000-000000000001'::uuid, -- Rohan Sharma (SALES)
    'a1000002-0000-4000-8000-000000000002'::uuid, -- Priya Nair (ACCOUNTS)
    'a1000003-0000-4000-8000-000000000003'::uuid, -- Vikram Patel (SITE_EXECUTION)
    'a1000004-0000-4000-8000-000000000004'::uuid, -- Meena Joshi (STORE_PURCHASE)
    'a1000005-0000-4000-8000-000000000005'::uuid, -- Arun Iyer (DESIGN)
    'a1000006-0000-4000-8000-000000000006'::uuid  -- Kavita Desai (LIAISONING)
  ];

  -- Real Staff Identifiers
  v_eshan  uuid := 'c1000001-0000-4000-8000-000000000001'; -- Eshan Choliya (Director)
  v_imran  uuid := 'c1000003-0000-4000-8000-000000000003'; -- Imran Khan (Operation / Design)
  v_harsh  uuid := 'c1000004-0000-4000-8000-000000000004'; -- Harsh Soni (Sales)
  v_maulik uuid := 'c1000005-0000-4000-8000-000000000005'; -- Maulik Parmar (Liaisoning)
  v_komal  uuid := 'c1000007-0000-4000-8000-000000000007'; -- Komal Prajapati (Accounts)
  v_ajay   uuid := 'c1000008-0000-4000-8000-000000000008'; -- Ajay Prajapati (Site Execution)
  v_jknair uuid := 'c1000013-0000-4000-8000-000000000013'; -- J K Nair (Store & Purchase)
BEGIN

  -- 1. Reassign Projects (references profiles)
  UPDATE public.projects
  SET lead_owner_id = v_harsh
  WHERE lead_owner_id = ANY(v_demo_ids);

  UPDATE public.projects
  SET survey_assigned_engineer_id = v_ajay
  WHERE survey_assigned_engineer_id = ANY(v_demo_ids);

  UPDATE public.projects
  SET payment_collected_by_id = v_komal
  WHERE payment_collected_by_id = ANY(v_demo_ids);

  UPDATE public.projects
  SET director_approved_by_id = v_eshan
  WHERE director_approved_by_id = ANY(v_demo_ids);

  -- 2. Reassign Site Surveys
  UPDATE public.site_surveys
  SET surveyed_by_id = v_ajay
  WHERE surveyed_by_id = ANY(v_demo_ids);

  -- 3. Reassign Design Files
  UPDATE public.design_files
  SET uploaded_by_id = v_imran
  WHERE uploaded_by_id = ANY(v_demo_ids);

  -- 4. Reassign BOMs & Store Ledger & Challans
  UPDATE public.boms
  SET created_by_id = v_jknair
  WHERE created_by_id = ANY(v_demo_ids);

  UPDATE public.delivery_challans
  SET created_by_id = v_jknair
  WHERE created_by_id = ANY(v_demo_ids);

  UPDATE public.stock_ledger
  SET created_by_id = v_jknair
  WHERE created_by_id = ANY(v_demo_ids);

  -- 5. Reassign Execution Stage Progress
  UPDATE public.execution_stage_progress
  SET completed_by_id = v_ajay
  WHERE completed_by_id = ANY(v_demo_ids);

  -- 6. Reassign Follow Ups & Activities & Quotations
  UPDATE public.follow_up_logs
  SET assigned_to_id = v_harsh
  WHERE assigned_to_id = ANY(v_demo_ids);

  UPDATE public.discom_follow_up_logs
  SET logged_by_id = v_maulik
  WHERE logged_by_id = ANY(v_demo_ids);

  UPDATE public.lead_activities
  SET created_by_id = v_harsh
  WHERE created_by_id = ANY(v_demo_ids);

  UPDATE public.quotations
  SET created_by_id = v_harsh
  WHERE created_by_id = ANY(v_demo_ids);

  -- 7. Reassign Comments & Reassignments
  UPDATE public.project_comments
  SET author_id = v_eshan
  WHERE author_id = '24be7984-4c2f-4437-8e79-b55b7108cef9'::uuid;

  UPDATE public.project_comments
  SET author_id = v_harsh
  WHERE author_id = 'a1000001-0000-4000-8000-000000000001'::uuid;

  UPDATE public.project_comments
  SET author_id = v_komal
  WHERE author_id = 'a1000002-0000-4000-8000-000000000002'::uuid;

  UPDATE public.project_comments
  SET author_id = v_ajay
  WHERE author_id = 'a1000003-0000-4000-8000-000000000003'::uuid;

  UPDATE public.project_comments
  SET author_id = v_jknair
  WHERE author_id = 'a1000004-0000-4000-8000-000000000004'::uuid;

  UPDATE public.project_comments
  SET author_id = v_imran
  WHERE author_id = 'a1000005-0000-4000-8000-000000000005'::uuid;

  UPDATE public.project_comments
  SET author_id = v_maulik
  WHERE author_id = 'a1000006-0000-4000-8000-000000000006'::uuid;

  UPDATE public.reassignment_logs
  SET reassigned_from_id = v_eshan
  WHERE reassigned_from_id = ANY(v_demo_ids);

  UPDATE public.reassignment_logs
  SET reassigned_to_id = v_harsh
  WHERE reassigned_to_id = ANY(v_demo_ids);

  UPDATE public.reassignment_logs
  SET reassigned_by_id = v_eshan
  WHERE reassigned_by_id = ANY(v_demo_ids);

  -- 8. Reassign tables referencing auth.users directly
  -- payment_milestones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_milestones') THEN
    UPDATE public.payment_milestones
    SET collected_by_id = v_komal
    WHERE collected_by_id = ANY(v_demo_ids);
  END IF;

  -- invoices
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    UPDATE public.invoices
    SET created_by_id = v_komal
    WHERE created_by_id = ANY(v_demo_ids);
  END IF;

  -- approval_audit_logs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approval_audit_logs') THEN
    UPDATE public.approval_audit_logs
    SET actor_id = v_eshan
    WHERE actor_id = ANY(v_demo_ids);
  END IF;

  -- purchase_orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    UPDATE public.purchase_orders
    SET created_by_id = v_jknair
    WHERE created_by_id = ANY(v_demo_ids);
  END IF;

  -- goods_receipt_notes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'goods_receipt_notes') THEN
    UPDATE public.goods_receipt_notes
    SET received_by_id = v_jknair
    WHERE received_by_id = ANY(v_demo_ids);
  END IF;

  -- cei_checklists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cei_checklists') THEN
    UPDATE public.cei_checklists
    SET verified_by_id = v_maulik
    WHERE verified_by_id = ANY(v_demo_ids);
  END IF;

  -- sld_specifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sld_specifications') THEN
    UPDATE public.sld_specifications
    SET created_by_id = v_imran
    WHERE created_by_id = ANY(v_demo_ids);
  END IF;

  -- 9. Delete user preferences / ephemeral data referencing auth.users
  DELETE FROM public.saved_views
  WHERE user_id = ANY(v_demo_ids);

  DELETE FROM public.notification_reads
  WHERE user_id = ANY(v_demo_ids);

  -- 10. Delete auth sessions & tokens
  DELETE FROM auth.sessions
  WHERE user_id = ANY(v_demo_ids);

  DELETE FROM auth.mfa_factors
  WHERE user_id = ANY(v_demo_ids);

  DELETE FROM auth.one_time_tokens
  WHERE user_id = ANY(v_demo_ids);

  -- 11. Delete from public.profiles
  DELETE FROM public.profiles
  WHERE id = ANY(v_demo_ids);

  -- 12. Delete from auth.identities
  DELETE FROM auth.identities
  WHERE user_id = ANY(v_demo_ids);

  -- 13. Delete from auth.users
  DELETE FROM auth.users
  WHERE id = ANY(v_demo_ids);

END $$;
