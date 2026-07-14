// ============================================================
// src/schemas/index.ts
// Zod validation schemas for forms across the domain model.
// ============================================================

import { z } from 'zod'

// ─── Auth Schemas ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// ─── Profile Schema ───────────────────────────────────────────

const timeSchema = z
  .string()
  .min(1, 'Time is required')
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Please enter a valid time (HH:MM)')

export const profileSchema = z.object({
  breakfast_time: timeSchema,
  lunch_time: timeSchema,
  dinner_time: timeSchema,
})

// ─── 1. Prescription Schema ───────────────────────────────────

export const prescriptionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Prescription title is required')
      .max(120, 'Title must be under 120 characters'),
    doctor_name: z
      .string()
      .min(1, 'Doctor name is required')
      .max(100, 'Doctor name must be under 100 characters'),
    hospital_name: z
      .string()
      .min(1, 'Hospital/Clinic name is required')
      .max(120, 'Hospital name must be under 120 characters'),
    description: z.string().optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    status: z.enum(['active', 'completed', 'cancelled']),
  })
  .refine(
    (data) => {
      if (!data.start_date || !data.end_date) return true
      return new Date(data.end_date) >= new Date(data.start_date)
    },
    {
      message: 'End date cannot be before start date',
      path: ['end_date'],
    }
  )

function getTodayLocalDateStr(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const createPrescriptionSchema = prescriptionSchema.refine(
  (data) => {
    if (!data.start_date) return true
    return data.start_date >= getTodayLocalDateStr()
  },
  {
    message: 'Prescription start date cannot be a previous day',
    path: ['start_date'],
  }
)

// ─── 2. Medicine Catalog Creation Schema ──────────────────────

export const medicineCatalogSchema = z.object({
  medicine_name: z
    .string()
    .min(1, 'Medicine name is required')
    .max(150, 'Name must be under 150 characters'),
  generic_name: z.string().optional(),
  brand_name: z.string().optional(),
  strength: z.string().optional(),
  dosage_form: z.string().optional(),
  manufacturer: z.string().optional(),
})

// ─── 3. Prescription Item Schema ──────────────────────────────

export const prescriptionItemSchema = z
  .object({
    medicine_id: z.string().min(1, 'Please select or create a medicine'),
    dosage: z
      .string()
      .min(1, 'Dosage instructions are required (e.g. 1 Tablet)'),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
    meal_types: z
      .array(z.enum(['breakfast', 'lunch', 'dinner']))
      .min(1, 'Please select at least one time (Morning, Afternoon, or Night)'),
    food_relation: z.enum(['before_food', 'after_food', 'with_food', 'anytime'], {
      error: 'Please select timing relative to food',
    }),
    custom_time: z.string().optional(),
    daily_frequency: z
      .number({ error: 'Frequency must be a number' })
      .int()
      .min(1, 'Frequency must be at least 1'),
    quantity_per_dose: z
      .number({ error: 'Quantity must be a number' })
      .int()
      .min(1, 'Quantity per dose must be at least 1'),
    remaining_stock: z
      .number({ error: 'Stock must be a number' })
      .int()
      .min(0, 'Stock cannot be negative'),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.food_relation === 'anytime') {
        return data.custom_time && data.custom_time.length > 0
      }
      return true
    },
    {
      message: 'Custom reminder time is required when "Anytime" is selected',
      path: ['custom_time'],
    }
  )

// Legacy medicine schema alias for transition compatibility
export const medicineSchema = z
  .object({
    medicine_name: z.string().min(1, 'Medicine name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
    food_relation: z.enum(['before_food', 'after_food', 'with_food', 'anytime']),
    custom_time: z.string().optional(),
    stock: z.number().int().min(0),
  })

// ─── Inferred Form Types ──────────────────────────────────────
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ProfileFormData = z.infer<typeof profileSchema>
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>
export type MedicineCatalogFormData = z.infer<typeof medicineCatalogSchema>
export type PrescriptionItemFormData = z.infer<typeof prescriptionItemSchema>
export type MedicineFormData = z.infer<typeof medicineSchema>
