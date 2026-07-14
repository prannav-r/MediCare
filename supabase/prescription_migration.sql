-- ============================================================
-- MediCare — Prescription Domain Architecture Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Enums (Idempotent) ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE prescription_status_enum AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'prescription_status_enum already exists, skipping.';
END $$;

DO $$ BEGIN
  CREATE TYPE meal_type_enum AS ENUM ('breakfast', 'lunch', 'dinner');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'meal_type_enum already exists, skipping.';
END $$;

DO $$ BEGIN
  CREATE TYPE food_relation_enum AS ENUM ('before_food', 'after_food', 'with_food', 'anytime');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'food_relation_enum already exists, skipping.';
END $$;

DO $$ BEGIN
  CREATE TYPE log_status_enum AS ENUM ('pending', 'taken', 'missed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'log_status_enum already exists, skipping.';
END $$;

-- ─── 2. Profiles Table (Ensure exists) ───────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  breakfast_time TIME NOT NULL DEFAULT '08:00',
  lunch_time     TIME NOT NULL DEFAULT '13:00',
  dinner_time    TIME NOT NULL DEFAULT '20:00',
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 3. Prescriptions Table ──────────────────────────────────
-- Represents one doctor's prescription for a user.

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  doctor_name   TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  description   TEXT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        prescription_status_enum NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ─── 4. Medicine Catalog Table ───────────────────────────────
-- Master definition of a medicine. Never contains prescription info.
-- Shared catalog accessible across prescriptions.

CREATE TABLE IF NOT EXISTS public.medicine_catalog (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  external_id   TEXT NULL,
  medicine_name TEXT NOT NULL,
  generic_name  TEXT NULL,
  brand_name    TEXT NULL,
  strength      TEXT NULL,
  dosage_form   TEXT NULL,
  manufacturer  TEXT NULL,
  source        TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'external_api', 'ocr')),
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 5. Prescription Items Table ─────────────────────────────
-- Represents one medicine item prescribed within a prescription.

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id                        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id           UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id               UUID NOT NULL REFERENCES public.medicine_catalog(id) ON DELETE RESTRICT,
  dosage                    TEXT NOT NULL,
  meal_type                 meal_type_enum NOT NULL,
  food_relation             food_relation_enum NOT NULL,
  custom_time               TIME NULL,
  daily_frequency           INTEGER NOT NULL DEFAULT 1 CHECK (daily_frequency >= 1),
  quantity_per_dose         INTEGER NOT NULL DEFAULT 1 CHECK (quantity_per_dose >= 1),
  total_quantity_prescribed INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity_prescribed >= 0),
  remaining_stock           INTEGER NOT NULL DEFAULT 0 CHECK (remaining_stock >= 0),
  notes                     TEXT NULL,
  created_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 6. Re-architected Medication Logs Table ─────────────────
-- Links each scheduled dose directly to a prescription item.

CREATE TABLE IF NOT EXISTS public.medication_logs_v2 (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prescription_item_id UUID NOT NULL REFERENCES public.prescription_items(id) ON DELETE CASCADE,
  scheduled_date       DATE NOT NULL,
  scheduled_time       TIME NOT NULL,
  status               log_status_enum NOT NULL DEFAULT 'pending',
  taken_at             TIMESTAMPTZ NULL,
  notes                TEXT NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_item_date UNIQUE (prescription_item_id, scheduled_date)
);

-- Migrate or replace legacy medication_logs cleanly
DROP TABLE IF EXISTS public.medication_logs CASCADE;
ALTER TABLE public.medication_logs_v2 RENAME TO medication_logs;

-- ─── 7. Performance Indexes ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id        ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status         ON public.prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_medicine_catalog_name        ON public.medicine_catalog(medicine_name);
CREATE INDEX IF NOT EXISTS idx_prescription_items_presc_id  ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_med_id    ON public.prescription_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id      ON public.medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_item_id      ON public.medication_logs(prescription_item_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_date         ON public.medication_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date    ON public.medication_logs(user_id, scheduled_date);

-- ─── 8. Auto-update updated_at Trigger Function ──────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_prescriptions_updated_at       ON public.prescriptions;
DROP TRIGGER IF EXISTS update_medicine_catalog_updated_at    ON public.medicine_catalog;
DROP TRIGGER IF EXISTS update_prescription_items_updated_at  ON public.prescription_items;
DROP TRIGGER IF EXISTS update_medication_logs_updated_at     ON public.medication_logs;

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_catalog_updated_at
  BEFORE UPDATE ON public.medicine_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_items_updated_at
  BEFORE UPDATE ON public.prescription_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medication_logs_updated_at
  BEFORE UPDATE ON public.medication_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 9. Row Level Security Policies ──────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_catalog   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs    ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Prescriptions RLS
DROP POLICY IF EXISTS "Users can view own prescriptions"   ON public.prescriptions;
DROP POLICY IF EXISTS "Users can insert own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can update own prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Users can delete own prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view own prescriptions"   ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions FOR DELETE USING (auth.uid() = user_id);

-- Medicine Catalog RLS (Globally readable by authenticated users, manually insertable)
DROP POLICY IF EXISTS "Authenticated users can view medicine catalog"   ON public.medicine_catalog;
DROP POLICY IF EXISTS "Authenticated users can insert medicine catalog" ON public.medicine_catalog;

CREATE POLICY "Authenticated users can view medicine catalog"
  ON public.medicine_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medicine catalog"
  ON public.medicine_catalog FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Prescription Items RLS (Accessible if user owns parent prescription)
DROP POLICY IF EXISTS "Users can view own prescription items"   ON public.prescription_items;
DROP POLICY IF EXISTS "Users can insert own prescription items" ON public.prescription_items;
DROP POLICY IF EXISTS "Users can update own prescription items" ON public.prescription_items;
DROP POLICY IF EXISTS "Users can delete own prescription items" ON public.prescription_items;

CREATE POLICY "Users can view own prescription items"
  ON public.prescription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE id = prescription_items.prescription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own prescription items"
  ON public.prescription_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE id = prescription_items.prescription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own prescription items"
  ON public.prescription_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE id = prescription_items.prescription_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE id = prescription_items.prescription_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own prescription items"
  ON public.prescription_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.prescriptions
      WHERE id = prescription_items.prescription_id
      AND user_id = auth.uid()
    )
  );

-- Medication Logs RLS
DROP POLICY IF EXISTS "Users can view own medication logs"   ON public.medication_logs;
DROP POLICY IF EXISTS "Users can insert own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can update own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can delete own medication logs" ON public.medication_logs;

CREATE POLICY "Users can view own medication logs"   ON public.medication_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medication logs" ON public.medication_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medication logs" ON public.medication_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own medication logs" ON public.medication_logs FOR DELETE USING (auth.uid() = user_id);
