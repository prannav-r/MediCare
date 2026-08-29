-- ============================================================================
-- MediCare MVP 3 — Simplified Database Schema
-- ============================================================================
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
--
-- This script sets up the entire production-grade database from scratch for MVP 3:
-- 1. Profiles table + Auto-create profile trigger on signup
-- 2. Prescriptions table
-- 3. Medicines (Catalog) table
-- 4. Prescription Items table
-- 5. Medicine Inventory table
-- 6. Performance Indexes
-- 7. Auto-updating updated_at triggers
-- 8. Complete Row Level Security (RLS) policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop legacy types if they exist to clean up the DB
DO $$ BEGIN DROP TYPE IF EXISTS prescription_status_enum CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS meal_type_enum CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS food_relation_enum CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN DROP TYPE IF EXISTS log_status_enum CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 🔥 COMPLETELY WIPE EXISTING SCHEMA 🔥
-- This ensures that tables are recreated perfectly for MVP 3.
DROP TABLE IF EXISTS public.medication_logs CASCADE;
DROP TABLE IF EXISTS public.medicine_inventory CASCADE;
DROP TABLE IF EXISTS public.prescription_items CASCADE;
DROP TABLE IF EXISTS public.prescriptions CASCADE;
DROP TABLE IF EXISTS public.medicine_catalog CASCADE;
DROP TABLE IF EXISTS public.medicines CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ─── 1. Profiles Table & Auth Signup Trigger ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Automatically create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. Prescriptions Table ──────────────────────────────────────────────────
-- Represents one doctor's prescription course for a user.
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  doctor_name   TEXT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ─── 3. Medicines Catalog Table ──────────────────────────────────────────────
-- Master catalog definition of a medicine. Shared across prescriptions.
CREATE TABLE IF NOT EXISTS public.medicines (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medicine_name TEXT NOT NULL,
  generic_name  TEXT NULL,
  brand_name    TEXT NULL,
  strength      TEXT NULL,
  dosage_form   TEXT NULL,
  manufacturer  TEXT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 4. Prescription Items Table ─────────────────────────────────────────────
-- Represents one medication item prescribed within a prescription course.
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id      UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id          UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  morning              BOOLEAN NOT NULL DEFAULT false,
  afternoon            BOOLEAN NOT NULL DEFAULT false,
  evening              BOOLEAN NOT NULL DEFAULT false,
  total_required_doses INTEGER NOT NULL DEFAULT 0 CHECK (total_required_doses >= 0),
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 5. Medicine Inventory Table ─────────────────────────────────────────────
-- Tracks the user's physical stock of a specific medicine across all prescriptions.
CREATE TABLE IF NOT EXISTS public.medicine_inventory (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id   UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  current_doses INTEGER NOT NULL DEFAULT 0 CHECK (current_doses >= 0),
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT unique_user_medicine_inventory UNIQUE (user_id, medicine_id)
);

-- ─── 6. Performance Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user_id             ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_user_id        ON public.prescriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_medicines_name               ON public.medicines(medicine_name);
CREATE INDEX IF NOT EXISTS idx_prescription_items_presc_id  ON public.prescription_items(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_med_id    ON public.prescription_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_medicine_inventory_user_id   ON public.medicine_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_medicine_inventory_med_id    ON public.medicine_inventory(medicine_id);

-- ─── 7. Auto-updating updated_at Trigger Function ────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at            ON public.profiles;
DROP TRIGGER IF EXISTS update_prescriptions_updated_at       ON public.prescriptions;
DROP TRIGGER IF EXISTS update_medicines_updated_at           ON public.medicines;
DROP TRIGGER IF EXISTS update_prescription_items_updated_at  ON public.prescription_items;
DROP TRIGGER IF EXISTS update_medicine_inventory_updated_at  ON public.medicine_inventory;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_items_updated_at
  BEFORE UPDATE ON public.prescription_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_inventory_updated_at
  BEFORE UPDATE ON public.medicine_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 8. Row Level Security (RLS) Policies ────────────────────────────────────
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_inventory ENABLE ROW LEVEL SECURITY;

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

-- Medicines Catalog RLS (Readable by all authenticated users, manually insertable)
DROP POLICY IF EXISTS "Authenticated users can view medicines"   ON public.medicines;
DROP POLICY IF EXISTS "Authenticated users can insert medicines" ON public.medicines;

CREATE POLICY "Authenticated users can view medicines"
  ON public.medicines FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert medicines"
  ON public.medicines FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Prescription Items RLS (Accessible if user owns the parent prescription)
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

-- Medicine Inventory RLS
DROP POLICY IF EXISTS "Users can view own medicine inventory"   ON public.medicine_inventory;
DROP POLICY IF EXISTS "Users can insert own medicine inventory" ON public.medicine_inventory;
DROP POLICY IF EXISTS "Users can update own medicine inventory" ON public.medicine_inventory;
DROP POLICY IF EXISTS "Users can delete own medicine inventory" ON public.medicine_inventory;

CREATE POLICY "Users can view own medicine inventory"   ON public.medicine_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medicine inventory" ON public.medicine_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medicine inventory" ON public.medicine_inventory FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own medicine inventory" ON public.medicine_inventory FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- End of MVP 3 Setup Script
-- ============================================================================
