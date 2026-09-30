-- =============================================================================
-- Migration: 00019_demo_teardown.sql
-- Description: DEMO DATA TEARDOWN — Sunfraa Global ERP
--
-- ⚠️  THIS SCRIPT REMOVES ALL DEMO / TEST DATA CREATED BY 00019_demo_seed.sql
--     It selectively purges rows with demo identifiers (prefixed UUIDs)
--     WITHOUT affecting real production data, real users, or existing masters.
-- =============================================================================

DO $$
DECLARE
  v_demo_user_ids uuid[] := ARRAY[
    'a1000001-0000-4000-8000-000000000001'::uuid,
    'a1000002-0000-4000-8000-000000000002'::uuid,
    'a1000003-0000-4000-8000-000000000003'::uuid,
    'a1000004-0000-4000-8000-000000000004'::uuid,
    'a1000005-0000-4000-8000-000000000005'::uuid,
    'a1000006-0000-4000-8000-000000000006'::uuid
  ];
  v_demo_project_ids uuid[] := ARRAY[
    'b1000001-0000-4000-8000-000000000001'::uuid,
    'b1000002-0000-4000-8000-000000000002'::uuid,
    'b1000003-0000-4000-8000-000000000003'::uuid,
    'b1000004-0000-4000-8000-000000000004'::uuid,
    'b1000005-0000-4000-8000-000000000005'::uuid,
    'b1000006-0000-4000-8000-000000000006'::uuid,
    'b1000007-0000-4000-8000-000000000007'::uuid,
    'b1000008-0000-4000-8000-000000000008'::uuid,
    'b1000009-0000-4000-8000-000000000009'::uuid,
    'b1000010-0000-4000-8000-000000000010'::uuid,
    'b1000011-0000-4000-8000-000000000011'::uuid,
    'b1000012-0000-4000-8000-000000000012'::uuid
  ];
  v_demo_labour_team_ids uuid[] := ARRAY[
    '21000001-0000-4000-8000-000000000001'::uuid,
    '21000001-0000-4000-8000-000000000002'::uuid,
    '21000001-0000-4000-8000-000000000003'::uuid,
    '21000001-0000-4000-8000-000000000004'::uuid
  ];
  v_demo_po_ids uuid[] := ARRAY[
    'a2000001-0000-4000-8000-000000000001'::uuid,
    'a2000001-0000-4000-8000-000000000002'::uuid
  ];
  v_demo_grn_ids uuid[] := ARRAY[
    'b2000001-0000-4000-8000-000000000001'::uuid
  ];
  v_demo_stock_ledger_ids uuid[] := ARRAY[
    '91000001-0000-4000-8000-000000000001'::uuid,
    '91000001-0000-4000-8000-000000000002'::uuid,
    '91000001-0000-4000-8000-000000000003'::uuid,
    '91000001-0000-4000-8000-000000000004'::uuid,
    '91000001-0000-4000-8000-000000000005'::uuid,
    '91000001-0000-4000-8000-000000000006'::uuid,
    '91000001-0000-4000-8000-000000000007'::uuid,
    '91000001-0000-4000-8000-000000000008'::uuid,
    '91000001-0000-4000-8000-000000000009'::uuid,
    '91000001-0000-4000-8000-000000000010'::uuid
  ];
BEGIN
  -- 1. Clean GRN items and GRNs
  DELETE FROM public.grn_items WHERE grn_id = ANY(v_demo_grn_ids);
  DELETE FROM public.goods_receipt_notes WHERE id = ANY(v_demo_grn_ids);

  -- 2. Clean PO items and POs
  DELETE FROM public.po_items WHERE po_id = ANY(v_demo_po_ids);
  DELETE FROM public.purchase_orders WHERE id = ANY(v_demo_po_ids);

  -- 3. Clean Stock ledger demo rows
  DELETE FROM public.stock_ledger WHERE id = ANY(v_demo_stock_ledger_ids) OR project_id = ANY(v_demo_project_ids);

  -- 4. Clean Delivery Challans
  DELETE FROM public.delivery_challans WHERE project_id = ANY(v_demo_project_ids);

  -- 5. Clean BOMs & BOM items
  DELETE FROM public.bom_items WHERE bom_id IN (SELECT id FROM public.boms WHERE project_id = ANY(v_demo_project_ids));
  DELETE FROM public.boms WHERE project_id = ANY(v_demo_project_ids);

  -- 6. Clean Execution records
  DELETE FROM public.execution_completions WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.execution_stage_progress WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.labour_assignments WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.labour_teams WHERE id = ANY(v_demo_labour_team_ids);

  -- 7. Clean CEI & Liaisoning records
  DELETE FROM public.cei_records WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.discom_follow_up_logs WHERE liaisoning_record_id IN (
    SELECT id FROM public.liaisoning_records WHERE project_id = ANY(v_demo_project_ids)
  );
  DELETE FROM public.liaisoning_records WHERE project_id = ANY(v_demo_project_ids);

  -- 8. Clean Design files
  DELETE FROM public.design_files WHERE project_id = ANY(v_demo_project_ids);

  -- 9. Clean Site Surveys
  DELETE FROM public.site_surveys WHERE project_id = ANY(v_demo_project_ids);

  -- 10. Clean Sales activities, checklists, quotations, comments, follow up logs
  DELETE FROM public.follow_up_logs WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.lead_activities WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.document_checklist_items WHERE project_id = ANY(v_demo_project_ids);
  DELETE FROM public.quotations WHERE project_id = ANY(v_demo_project_ids);
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_comments' AND table_schema = 'public') THEN
    DELETE FROM public.project_comments WHERE project_id = ANY(v_demo_project_ids);
  END IF;

  -- 11. Clean Projects
  DELETE FROM public.projects WHERE id = ANY(v_demo_project_ids);

  -- 12. Clean Profiles & Demo Auth Users
  DELETE FROM public.profiles WHERE id = ANY(v_demo_user_ids);
  DELETE FROM auth.users WHERE id = ANY(v_demo_user_ids);

  RAISE NOTICE 'Demo data purge complete.';
END $$;
