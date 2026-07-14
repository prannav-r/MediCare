// ============================================================
// src/types/index.ts
// Central export for all application domain types.
// Models real-world medical prescriptions:
//   User -> Profile -> Prescription -> Prescription Item -> Medicine Catalog -> Medication Log
// ============================================================

// ─── Profile Types ───────────────────────────────────────────
export interface Profile {
  id: string
  user_id: string
  breakfast_time: string       // stored as "HH:MM" e.g. "08:00"
  lunch_time: string           // stored as "HH:MM" e.g. "13:00"
  dinner_time: string          // stored as "HH:MM" e.g. "20:00"
  created_at: string
  updated_at: string
}

// ─── Enums & Helper Types ────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type FoodRelation = 'before_food' | 'after_food' | 'with_food' | 'anytime'
export type PrescriptionStatus = 'active' | 'completed' | 'cancelled'
export type MedicineSource = 'manual' | 'external_api' | 'ocr'
export type LogStatus = 'pending' | 'taken' | 'missed' | 'skipped'

export interface AuthUser {
  id: string
  email: string | undefined
}

// ─── 1. Prescription Entity ──────────────────────────────────
export interface Prescription {
  id: string
  user_id: string
  title: string
  doctor_name: string
  hospital_name: string
  description: string | null
  start_date: string           // "YYYY-MM-DD"
  end_date: string             // "YYYY-MM-DD"
  status: PrescriptionStatus
  created_at: string
  updated_at: string
}

// ─── 2. Medicine Catalog Entity ──────────────────────────────
// Master definition of a medicine. Never contains prescription-specific info.
export interface MedicineCatalogItem {
  id: string
  external_id: string | null
  medicine_name: string
  generic_name: string | null
  brand_name: string | null
  strength: string | null
  dosage_form: string | null
  manufacturer: string | null
  source: MedicineSource
  created_at: string
  updated_at: string
}

// ─── 3. Prescription Item Entity ─────────────────────────────
// Represents one medicine item inside one prescription.
export interface PrescriptionItem {
  id: string
  prescription_id: string
  medicine_id: string
  dosage: string
  meal_type: MealType
  meal_types?: MealType[]
  food_relation: FoodRelation
  custom_time: string | null
  daily_frequency: number
  quantity_per_dose: number
  total_quantity_prescribed: number
  remaining_stock: number
  notes: string | null
  created_at: string
  updated_at: string
}

// Joined representation for UI rendering (Prescription Item + Medicine Catalog details + Parent Prescription)
export interface PrescriptionItemWithMedicine extends PrescriptionItem {
  medicine: MedicineCatalogItem
  prescription?: Prescription
}

// Legacy Medicine interface alias for backwards compatibility during migration transitions
export interface Medicine {
  id: string
  user_id?: string
  medicine_name: string
  dosage: string
  meal_type: MealType
  food_relation: FoodRelation
  custom_time: string | null
  stock: number
  remaining_stock?: number
  created_at?: string
  updated_at?: string
}

// ─── 4. Medication Log Entity ────────────────────────────────
export interface MedicationLog {
  id: string
  user_id: string
  prescription_item_id: string
  scheduled_date: string       // "YYYY-MM-DD"
  scheduled_time: string       // "HH:MM"
  status: LogStatus
  taken_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// Combined view item for daily schedule sheet
export interface DailyScheduleItem {
  prescriptionItem: PrescriptionItemWithMedicine
  medicine: {
    id: string
    medicine_name: string
    dosage: string
    meal_type: MealType
    food_relation: FoodRelation
    custom_time: string | null
  }
  logId?: string
  scheduledDate: string
  scheduledTime: string
  status: LogStatus
  takenAt: string | null
  notes: string | null
}

// ─── Display Labels ──────────────────────────────────────────
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
}

export const FOOD_RELATION_LABELS: Record<FoodRelation, string> = {
  before_food: 'Before Food',
  after_food: 'After Food',
  with_food: 'With Food',
  anytime: 'Anytime',
}

export const PRESCRIPTION_STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const LOG_STATUS_LABELS: Record<LogStatus, string> = {
  pending: 'Pending',
  taken: 'Taken',
  missed: 'Missed',
  skipped: 'Skipped',
}
