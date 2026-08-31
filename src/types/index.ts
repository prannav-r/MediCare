// ============================================================
// src/types/index.ts
// MVP 3: Simplified Domain Types
// ============================================================

// ─── Constants ───────────────────────────────────────────────
export const FIXED_SCHEDULE = {
  morning: '07:00',
  afternoon: '12:00',
  evening: '19:00',
} as const

// ─── Profile Types ───────────────────────────────────────────
export interface Profile {
  id: string
  user_id: string
  created_at: string
  updated_at: string
}

// ─── Enums & Helper Types ────────────────────────────────────
export type MedicineSource = 'manual' | 'external_api' | 'ocr'

export interface AuthUser {
  id: string
  email: string | undefined
}

// ─── 1. Prescription Entity ──────────────────────────────────
export interface Prescription {
  id: string
  user_id: string
  title: string
  doctor_name: string | null
  start_date: string           // "YYYY-MM-DD"
  end_date: string             // "YYYY-MM-DD"
  created_at: string
  updated_at: string
}

// ─── 2. Medicine Catalog Entity ──────────────────────────────
export interface Medicine {
  id: string
  medicine_name: string
  generic_name: string | null
  brand_name: string | null
  strength: string | null
  dosage_form: string | null
  manufacturer: string | null
  created_at: string
  updated_at: string
}

// ─── 3. Prescription Item Entity ─────────────────────────────
export interface PrescriptionItem {
  id: string
  prescription_id: string
  medicine_id: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  quantity_per_dose: number
  total_required_doses: number
  created_at: string
  updated_at: string
}

// Joined representation for UI rendering
export interface PrescriptionItemWithMedicine extends PrescriptionItem {
  medicine: Medicine
  prescription?: Prescription
}

// ─── 4. Medicine Inventory Entity ────────────────────────────
export interface MedicineInventory {
  id: string
  user_id: string
  medicine_id: string
  current_doses: number
  created_at: string
  updated_at: string
}

// Joined representation for UI rendering (useful for Low Stock lists)
export interface MedicineInventoryWithMedicine extends MedicineInventory {
  medicine: Medicine
}
