-- Migration: 00013_store_masters.sql
-- Description: Adds items master, suppliers master, HSN codes, and reorder point configuration

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE item_category AS ENUM (
    'PANEL',
    'INVERTER',
    'STRUCTURE',
    'CABLE',
    'BOS',
    'CIVIL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_unit AS ENUM (
    'NOS',
    'MTR',
    'SET',
    'KG'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE supplier_payment_terms AS ENUM (
    'ADVANCE',
    'NET_15',
    'NET_30',
    'NET_60'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create items_master table
CREATE TABLE IF NOT EXISTS public.items_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE NOT NULL,
  name text NOT NULL,
  category item_category NOT NULL,
  unit item_unit NOT NULL DEFAULT 'NOS',
  hsn_code text,
  gst_rate numeric(5, 2) NOT NULL DEFAULT 13.8,
  reorder_point numeric(10, 2) NOT NULL DEFAULT 10,
  min_order_qty numeric(10, 2) NOT NULL DEFAULT 1,
  standard_cost numeric(10, 2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_master_active ON public.items_master (is_active);

ALTER TABLE public.items_master ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'items_master' AND policyname = 'items_master_select_policy'
  ) THEN
    CREATE POLICY items_master_select_policy ON public.items_master
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'items_master' AND policyname = 'items_master_all_policy'
  ) THEN
    CREATE POLICY items_master_all_policy ON public.items_master
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_person text,
  phone text NOT NULL,
  email text,
  gstin text,
  city text NOT NULL,
  payment_terms supplier_payment_terms NOT NULL DEFAULT 'NET_30',
  rating integer NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers (is_active);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'suppliers_select_policy'
  ) THEN
    CREATE POLICY suppliers_select_policy ON public.suppliers
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'suppliers_all_policy'
  ) THEN
    CREATE POLICY suppliers_all_policy ON public.suppliers
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Seed Standard Solar Items Master
INSERT INTO public.items_master (item_code, name, category, unit, hsn_code, gst_rate, reorder_point, min_order_qty, standard_cost, is_active)
VALUES
  ('ITM-PNL-545', '545W Mono PERC Solar PV Panels', 'PANEL', 'NOS', '85414011', 12.0, 40, 20, 8500.00, true),
  ('ITM-INV-5KW-3P', '5kW 3-Phase Grid-Tie Solar Inverter', 'INVERTER', 'NOS', '85044090', 12.0, 5, 1, 42000.00, true),
  ('ITM-INV-3KW-1P', '3.3kW Single Phase Grid-Tie Inverter', 'INVERTER', 'NOS', '85044090', 12.0, 5, 1, 28000.00, true),
  ('ITM-STR-HDG-HR', 'HDG Elevated High-Rise Structure Rails & Purlins', 'STRUCTURE', 'SET', '73089090', 18.0, 10, 2, 6500.00, true),
  ('ITM-CBL-4MM-DC', '4 sq mm 1C Solar DC Cable Red/Black', 'CABLE', 'MTR', '85446090', 18.0, 500, 100, 45.00, true),
  ('ITM-CBL-6MM-DC', '6 sq mm 1C Solar DC Cable', 'CABLE', 'MTR', '85446090', 18.0, 300, 100, 65.00, true),
  ('ITM-BOS-ACDC-BOX', 'ACDB & DCDB Surge Protection Enclosure Box', 'BOS', 'SET', '85371000', 18.0, 10, 2, 4800.00, true),
  ('ITM-BOS-EARTH-CHEM', 'Chemical Earthing Electrode (2m) & Bentonite Compound', 'BOS', 'SET', '85359090', 18.0, 15, 5, 3200.00, true),
  ('ITM-CVL-GROUT-50KG', 'High-Strength Non-Shrink Foundation Grout (50kg)', 'CIVIL', 'KG', '38245090', 18.0, 100, 20, 85.00, true)
ON CONFLICT (item_code) DO NOTHING;

-- 5. Seed Standard Suppliers
INSERT INTO public.suppliers (name, contact_person, phone, email, gstin, city, payment_terms, rating, is_active)
VALUES
  ('Waaree Energies Ltd', 'Karan Mehta', '+91 98250 11990', 'sales@waaree.com', '24AAACW1234F1Z1', 'Mumbai / Surat', 'NET_30', 5, true),
  ('Growatt New Energy Tech', 'Ankit Patel', '+91 98250 22881', 'support.in@growatt.com', '24AABCG5678H1Z2', 'Ahmedabad', 'ADVANCE', 5, true),
  ('Polycab India Ltd', 'Ramesh Shah', '+91 98250 33772', 'cables@polycab.com', '24AAACP9012K1Z3', 'Vadodara', 'NET_30', 4, true),
  ('Jindal High-Rise Structure Works', 'Dharmesh Prajapati', '+91 98250 44663', 'structures@jindalsolar.in', '24AAACJ3456L1Z4', 'Surat', 'NET_15', 4, true)
ON CONFLICT DO NOTHING;
