// ============================================================
// src/schemas/index.ts
// Zod validation schemas for forms across the domain model (MVP 3)
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

// ─── 1. Prescription Schema ───────────────────────────────────

export const prescriptionSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Prescription title is required')
      .max(120, 'Title must be under 120 characters'),
    doctor_name: z
      .string()
      .max(100, 'Doctor name must be under 100 characters')
      .optional()
      .nullable(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
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

// ─── 3. Prescription Item (Add Medicine) Schema ───────────────

export const prescriptionItemSchema = z
  .object({
    medicine_id: z.string().min(1, 'Please select or create a medicine'),
    morning: z.boolean().default(false),
    afternoon: z.boolean().default(false),
    evening: z.boolean().default(false),
    current_doses: z
      .coerce.number()
      .int()
      .min(0, 'Inventory cannot be negative'),
  })
  .refine(
    (data) => {
      return data.morning || data.afternoon || data.evening
    },
    {
      message: 'Please select at least one schedule time (Morning, Afternoon, or Evening)',
      path: ['evening'], // Attach error to one of the checkboxes so it's visible
    }
  )

// ─── Inferred Form Types ──────────────────────────────────────
export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type PrescriptionFormData = z.infer<typeof prescriptionSchema>
export type MedicineCatalogFormData = z.infer<typeof medicineCatalogSchema>
export type PrescriptionItemFormData = z.infer<typeof prescriptionItemSchema>
