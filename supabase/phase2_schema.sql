-- ============================================================
-- MediCare — Phase 2 Database Schema Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. Create Log Status ENUM Type (Idempotent) ──────────────
DO $$ BEGIN
  CREATE TYPE log_status_enum AS ENUM ('pending', 'taken', 'missed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'log_status_enum already exists, skipping.';
END $$;

-- ─── 2. Create medication_logs Table ──────────────────────────
-- Stores daily tracking history for every medicine.
-- Even if a user hasn't explicitly clicked anything on a past date,
-- we can evaluate/insert pending or missed doses into this table
-- to maintain an auditable medication history.

CREATE TABLE IF NOT EXISTS public.medication_logs (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medicine_id    UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status         log_status_enum NOT NULL DEFAULT 'pending',
  taken_at       TIMESTAMPTZ NULL,
  notes          TEXT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint ensures only one log entry per medicine per day
  CONSTRAINT unique_medicine_date UNIQUE (medicine_id, scheduled_date)
);

-- ─── 3. Indexes for Analytics & Calendar Performance ──────────
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_date    ON public.medication_logs(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_medication_logs_status  ON public.medication_logs(status);
CREATE INDEX IF NOT EXISTS idx_medication_logs_user_date ON public.medication_logs(user_id, scheduled_date);

-- ─── 4. Auto-update updated_at Trigger ────────────────────────
DROP TRIGGER IF EXISTS update_medication_logs_updated_at ON public.medication_logs;

CREATE TRIGGER update_medication_logs_updated_at
  BEFORE UPDATE ON public.medication_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 5. Row Level Security Policies ───────────────────────────
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own medication logs"   ON public.medication_logs;
DROP POLICY IF EXISTS "Users can insert own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can update own medication logs" ON public.medication_logs;
DROP POLICY IF EXISTS "Users can delete own medication logs" ON public.medication_logs;

CREATE POLICY "Users can view own medication logs"
  ON public.medication_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication logs"
  ON public.medication_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication logs"
  ON public.medication_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication logs"
  ON public.medication_logs FOR DELETE
  USING (auth.uid() = user_id);
