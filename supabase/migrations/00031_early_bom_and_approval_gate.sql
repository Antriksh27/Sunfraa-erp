-- Migration: 00031_early_bom_and_approval_gate.sql
-- Description:
-- 1. Adds approved_at and approved_by_id columns to boms table.
-- 2. Removes BOM creation side effect from trg_on_project_director_approved.
-- 3. Extends check_project_field_permissions to guard BOM approved_at / approved_by_id (HEAD_ENGINEER / DIRECTOR only).
-- 4. Blocks labour assignments if project's BOM is not yet approved.
-- 5. Auto-populates real BOM with line items on INITIAL design upload.

-- 1. Add approved_at and approved_by_id columns to boms
ALTER TABLE public.boms
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES public.profiles(id);

-- 2. Update RLS policies for boms and bom_items to allow DESIGN, STORE_PURCHASE, HEAD_ENGINEER, DIRECTOR
DROP POLICY IF EXISTS "boms_write" ON boms;
CREATE POLICY "boms_write"
  ON boms FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'HEAD_ENGINEER', 'DESIGN'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'HEAD_ENGINEER', 'DESIGN'));

DROP POLICY IF EXISTS "bom_items_write" ON bom_items;
CREATE POLICY "bom_items_write"
  ON bom_items FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'HEAD_ENGINEER', 'DESIGN'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'STORE_PURCHASE', 'HEAD_ENGINEER', 'DESIGN'));

DROP POLICY IF EXISTS "labour_assignments_write" ON labour_assignments;
CREATE POLICY "labour_assignments_write"
  ON labour_assignments FOR ALL
  USING (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'))
  WITH CHECK (auth_role() IN ('DIRECTOR', 'SITE_EXECUTION', 'HEAD_ENGINEER'));

-- 3. Remove BOM creation side effect from on_project_director_approved
CREATE OR REPLACE FUNCTION on_project_director_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.director_approved_at IS NULL AND NEW.director_approved_at IS NOT NULL) THEN
    -- Advance stage to DIRECTOR_APPROVED
    NEW.stage := 'DIRECTOR_APPROVED';
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Extend check_project_field_permissions for boms approval gate
CREATE OR REPLACE FUNCTION check_project_field_permissions()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_TABLE_NAME = 'projects') THEN
    IF (auth_role() NOT IN ('DIRECTOR', 'ACCOUNTS')) THEN
      IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status OR
          OLD.payment_collected_at IS DISTINCT FROM NEW.payment_collected_at OR
          OLD.payment_collected_by_id IS DISTINCT FROM NEW.payment_collected_by_id) THEN
        RAISE EXCEPTION 'Only ACCOUNTS or DIRECTOR can modify payment fields.';
      END IF;
    END IF;

    IF (auth_role() != 'DIRECTOR') THEN
      IF (OLD.director_approved_at IS DISTINCT FROM NEW.director_approved_at OR
          OLD.director_approved_by_id IS DISTINCT FROM NEW.director_approved_by_id) THEN
        RAISE EXCEPTION 'Only DIRECTOR can approve projects for execution.';
      END IF;
    END IF;

  ELSIF (TG_TABLE_NAME = 'boms') THEN
    IF (auth_role() NOT IN ('DIRECTOR', 'HEAD_ENGINEER')) THEN
      IF (OLD.approved_at IS DISTINCT FROM NEW.approved_at OR
          OLD.approved_by_id IS DISTINCT FROM NEW.approved_by_id) THEN
        RAISE EXCEPTION 'Only HEAD_ENGINEER or DIRECTOR can approve BOMs.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_bom_field_permissions ON public.boms;
CREATE TRIGGER trg_check_bom_field_permissions
  BEFORE UPDATE ON public.boms
  FOR EACH ROW
  EXECUTE FUNCTION check_project_field_permissions();

-- 5. Block labour assignment if BOM not approved
CREATE OR REPLACE FUNCTION check_labour_assignment_bom_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_approved_at TIMESTAMPTZ;
BEGIN
  SELECT approved_at INTO v_approved_at
  FROM public.boms
  WHERE project_id = NEW.project_id;

  IF (v_approved_at IS NULL) THEN
    RAISE EXCEPTION 'BOM must be approved by the Head Engineer before labour can be assigned.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_labour_assignment_bom_approved ON public.labour_assignments;
CREATE TRIGGER trg_check_labour_assignment_bom_approved
  BEFORE INSERT ON public.labour_assignments
  FOR EACH ROW
  EXECUTE FUNCTION check_labour_assignment_bom_approved();

-- 6. Trigger to auto-populate BOM on INITIAL design upload
CREATE OR REPLACE FUNCTION on_initial_design_uploaded()
RETURNS TRIGGER AS $$
DECLARE
  v_bom_id UUID;
  v_project RECORD;
  v_sld RECORD;
  v_panel_count INT;
  v_inverter_kw NUMERIC;
  v_dc_cable NUMERIC;
  v_ac_cable NUMERIC;
BEGIN
  IF (NEW.type = 'INITIAL') THEN
    -- Fetch project info
    SELECT id, kw_required, category INTO v_project
    FROM public.projects
    WHERE id = NEW.project_id;

    -- Fetch SLD specifications if available
    SELECT * INTO v_sld
    FROM public.sld_specifications
    WHERE project_id = NEW.project_id;

    -- Create or fetch BOM
    INSERT INTO public.boms (project_id, created_by_id)
    VALUES (NEW.project_id, NEW.uploaded_by_id)
    ON CONFLICT (project_id) DO NOTHING;

    SELECT id INTO v_bom_id FROM public.boms WHERE project_id = NEW.project_id;

    -- If no items in this BOM yet, auto-populate line items
    IF NOT EXISTS (SELECT 1 FROM public.bom_items WHERE bom_id = v_bom_id) THEN
      v_panel_count := COALESCE(v_sld.panel_count, CEIL((COALESCE(v_project.kw_required, 5)::numeric * 1000) / 550)::INT);
      v_inverter_kw := COALESCE(v_sld.inverter_kw, COALESCE(v_project.kw_required, 5)::numeric);
      v_dc_cable := COALESCE(v_sld.dc_cable_length_m, ROUND((COALESCE(v_project.kw_required, 5)::numeric * 15), 2));
      v_ac_cable := COALESCE(v_sld.ac_cable_length_m, ROUND((COALESCE(v_project.kw_required, 5)::numeric * 10), 2));

      INSERT INTO public.bom_items (bom_id, item_name, category, quantity, unit) VALUES
        (v_bom_id, 'Mono PERC Solar PV Modules 550W (' || v_panel_count || ' Panels)', 'PANEL', v_panel_count, 'NOS'),
        (v_bom_id, 'Solar Grid-Tied Inverter ' || v_inverter_kw || ' kW', 'INVERTER', 1, 'NOS'),
        (v_bom_id, 'GI Elevated Solar Mounting Structure (' || COALESCE(v_project.kw_required, 5) || ' kW System)', 'STRUCTURE', COALESCE(v_project.kw_required, 5), 'SET'),
        (v_bom_id, '4 sq.mm 1C Copper Solar DC Cable UV Resistant', 'CABLE', v_dc_cable, 'MTR'),
        (v_bom_id, '4-Core Copper Armoured AC Cable', 'CABLE', v_ac_cable, 'MTR'),
        (v_bom_id, 'DCDB & ACDB Distribution Boxes with SPD & MCBs', 'BOS', 1, 'SET'),
        (v_bom_id, 'Chemical Earthing Kit & Lightning Arrestor (LA)', 'BOS', 1, 'SET');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_initial_design_uploaded ON public.design_files;
CREATE TRIGGER trg_on_initial_design_uploaded
  AFTER INSERT ON public.design_files
  FOR EACH ROW
  EXECUTE FUNCTION on_initial_design_uploaded();
