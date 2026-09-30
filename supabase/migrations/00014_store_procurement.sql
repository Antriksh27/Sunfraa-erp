-- Migration: 00014_store_procurement.sql
-- Description: Adds purchase orders, po_items, goods receipt notes (GRN), and automated stock IN sync

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE po_status AS ENUM (
    'DRAFT',
    'ISSUED',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CANCELLED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create purchase_orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text UNIQUE NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  status po_status NOT NULL DEFAULT 'ISSUED',
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  issued_at timestamptz NOT NULL DEFAULT now(),
  created_by_id uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders (status);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_select_policy'
  ) THEN
    CREATE POLICY purchase_orders_select_policy ON public.purchase_orders
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'purchase_orders_all_policy'
  ) THEN
    CREATE POLICY purchase_orders_all_policy ON public.purchase_orders
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Create po_items table
CREATE TABLE IF NOT EXISTS public.po_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_master_id uuid NOT NULL REFERENCES public.items_master(id),
  item_name text NOT NULL,
  quantity numeric(10, 2) NOT NULL,
  unit_price numeric(10, 2) NOT NULL,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 18,
  amount numeric(12, 2) NOT NULL,
  quantity_received numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_po_items_po_id ON public.po_items (po_id);

ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'po_items' AND policyname = 'po_items_select_policy'
  ) THEN
    CREATE POLICY po_items_select_policy ON public.po_items
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'po_items' AND policyname = 'po_items_all_policy'
  ) THEN
    CREATE POLICY po_items_all_policy ON public.po_items
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Create goods_receipt_notes (GRN) table
CREATE TABLE IF NOT EXISTS public.goods_receipt_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number text UNIQUE NOT NULL,
  po_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  received_by_id uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goods_receipt_notes_po_id ON public.goods_receipt_notes (po_id);

ALTER TABLE public.goods_receipt_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'goods_receipt_notes' AND policyname = 'goods_receipt_notes_select_policy'
  ) THEN
    CREATE POLICY goods_receipt_notes_select_policy ON public.goods_receipt_notes
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'goods_receipt_notes' AND policyname = 'goods_receipt_notes_all_policy'
  ) THEN
    CREATE POLICY goods_receipt_notes_all_policy ON public.goods_receipt_notes
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. Create grn_items table
CREATE TABLE IF NOT EXISTS public.grn_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid NOT NULL REFERENCES public.goods_receipt_notes(id) ON DELETE CASCADE,
  po_item_id uuid NOT NULL REFERENCES public.po_items(id),
  quantity_received numeric(10, 2) NOT NULL,
  quantity_rejected numeric(10, 2) NOT NULL DEFAULT 0,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grn_items_grn_id ON public.grn_items (grn_id);

ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grn_items' AND policyname = 'grn_items_select_policy'
  ) THEN
    CREATE POLICY grn_items_select_policy ON public.grn_items
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'grn_items' AND policyname = 'grn_items_all_policy'
  ) THEN
    CREATE POLICY grn_items_all_policy ON public.grn_items
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
