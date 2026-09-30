-- Migration: 00001_initial_schema.sql
-- Description: Core Postgres enums, tables, and foreign keys for Sunfraa Global ERP

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'DIRECTOR',
  'SALES',
  'ACCOUNTS',
  'SITE_EXECUTION',
  'STORE_PURCHASE',
  'DESIGN',
  'LIAISONING'
);

CREATE TYPE project_category AS ENUM (
  'RESIDENTIAL_BUNGALOW',
  'RESIDENTIAL_FLAT',
  'COMMERCIAL',
  'INDUSTRIAL'
);

CREATE TYPE project_stage AS ENUM (
  'LEAD',
  'SITE_SURVEY_SCHEDULED',
  'SITE_SURVEY_DONE',
  'DESIGN_PENDING',
  'DESIGN_UPLOADED',
  'QUOTATION_SENT',
  'STALE',
  'PAYMENT_COLLECTED',
  'DIRECTOR_APPROVED',
  'EXECUTION_IN_PROGRESS',
  'EXECUTION_COMPLETE',
  'LIAISONING_IN_PROGRESS',
  'CEI_IN_PROGRESS',
  'CONNECTED',
  'CLOSED'
);

CREATE TYPE payment_status AS ENUM (
  'PENDING',
  'COLLECTED'
);

CREATE TYPE design_file_type AS ENUM (
  'INITIAL',
  'CEI_DRAWING'
);

CREATE TYPE stock_direction AS ENUM (
  'IN',
  'OUT'
);

CREATE TYPE execution_stage AS ENUM (
  'STRUCTURE_FABRICATION',
  'PANEL',
  'WIRING',
  'CIVIL'
);

CREATE TYPE completion_capture_method AS ENUM (
  'SCAN',
  'PHOTO_OCR'
);

-- ============================================================================
-- 2. TABLES (In dependency order)
-- ============================================================================

-- 1. Profiles (1:1 with auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Projects (Central Entity)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  category project_category NOT NULL,
  kw_required FLOAT8 NOT NULL,
  sanctioned_load TEXT,
  connection_number TEXT,
  lead_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stage project_stage NOT NULL DEFAULT 'LEAD',
  quotation_amount NUMERIC(12, 2),
  quotation_sent_at TIMESTAMPTZ,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  payment_collected_at TIMESTAMPTZ,
  payment_collected_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  director_approved_at TIMESTAMPTZ,
  director_approved_by_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cei_required BOOLEAN GENERATED ALWAYS AS (kw_required > 10) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Site Survey (1:1 with Project)
CREATE TABLE site_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  no_of_panels INTEGER NOT NULL DEFAULT 0,
  physical_measurement TEXT NOT NULL,
  photo_urls TEXT[] NOT NULL DEFAULT '{}',
  diagram_urls TEXT[] NOT NULL DEFAULT '{}',
  gps_location TEXT NOT NULL,
  contacted_person TEXT NOT NULL,
  surveyed_by_id UUID NOT NULL REFERENCES profiles(id),
  surveyed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Design Files (Versioned Initial & CEI Drawings)
CREATE TABLE design_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type design_file_type NOT NULL,
  file_url TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  uploaded_by_id UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BOM (1:1 with Project)
CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BOM Items
CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity FLOAT8 NOT NULL,
  unit TEXT NOT NULL
);

-- 7. Delivery Challans
CREATE TABLE delivery_challans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_mobile TEXT NOT NULL,
  distance FLOAT8 NOT NULL,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Stock Ledger
CREATE TABLE stock_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  direction stock_direction NOT NULL,
  quantity FLOAT8 NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  delivery_challan_id UUID REFERENCES delivery_challans(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_out_requires_challan_and_project CHECK (
    direction = 'IN' OR (direction = 'OUT' AND delivery_challan_id IS NOT NULL AND project_id IS NOT NULL)
  )
);

-- 9. Labour Teams
CREATE TABLE labour_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  headcount INTEGER NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE
);

-- 10. Labour Assignments (Database-level one-active-date constraint: Business Rule 7)
CREATE TABLE labour_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labour_team_id UUID NOT NULL REFERENCES labour_teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage execution_stage NOT NULL,
  assigned_date DATE NOT NULL,
  CONSTRAINT labour_assignment_unique_team_date UNIQUE (labour_team_id, assigned_date)
);

-- 11. Execution Stage Progress
CREATE TABLE execution_stage_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage execution_stage NOT NULL,
  photo_url TEXT NOT NULL,
  comment TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_by_id UUID NOT NULL REFERENCES profiles(id)
);

-- 12. Execution Completions (1:1 with Project)
CREATE TABLE execution_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  panel_serial_numbers TEXT[] NOT NULL DEFAULT '{}',
  panel_count INTEGER NOT NULL,
  inverter_serial_number TEXT NOT NULL,
  captured_via completion_capture_method NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Follow Up Logs (Sales 3-day reminder cadence)
CREATE TABLE follow_up_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reminder_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_to_id UUID NOT NULL REFERENCES profiles(id),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14. Liaisoning Records (1:1 with Project)
CREATE TABLE liaisoning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  documents_received_at TIMESTAMPTZ,
  acknowledgement_number TEXT,
  govt_estimate_quotation_number TEXT,
  govt_estimate_amount NUMERIC(12, 2),
  estimate_paid_at TIMESTAMPTZ,
  discom_file_ready_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  meter_report_url TEXT,
  meter_report_uploaded_at TIMESTAMPTZ
);

-- 15. DISCOM Follow Up Logs
CREATE TABLE discom_follow_up_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liaisoning_record_id UUID NOT NULL REFERENCES liaisoning_records(id) ON DELETE CASCADE,
  follow_up_date DATE NOT NULL,
  note TEXT NOT NULL,
  logged_by_id UUID NOT NULL REFERENCES profiles(id)
);

-- 16. CEI Records (1:1 with Project)
CREATE TABLE cei_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  self_certificate_generated_at TIMESTAMPTZ,
  filed_for_client_signing_at TIMESTAMPTZ,
  drawing_approval_design_file_id UUID REFERENCES design_files(id) ON DELETE SET NULL,
  cei_portal_reference_number TEXT,
  cei_approved_at TIMESTAMPTZ,
  cei_approval_upload_url TEXT,
  inspection_reference_number TEXT,
  inspector_name TEXT,
  inspector_date DATE,
  inspector_contact TEXT
);

-- Indexes for performance
CREATE INDEX idx_projects_lead_owner ON projects(lead_owner_id);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE INDEX idx_design_files_project ON design_files(project_id, type);
CREATE INDEX idx_stock_ledger_project ON stock_ledger(project_id);
CREATE INDEX idx_labour_assignments_date ON labour_assignments(assigned_date);
CREATE INDEX idx_execution_progress_project ON execution_stage_progress(project_id);
