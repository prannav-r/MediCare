// ============================================================
// src/services/prescriptionService.ts
// Service layer for doctor prescriptions CRUD.
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Prescription } from '@/types'
import type { PrescriptionFormData } from '@/schemas'

export const prescriptionService = {
  // ── 1. Get All Prescriptions for User ─────────────────────────
  async getPrescriptions(userId: string): Promise<Prescription[]> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return data ?? []
  },

  // ── 2. Get Single Prescription by ID ──────────────────────────
  async getPrescriptionById(id: string): Promise<Prescription> {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // ── 3. Create Prescription ────────────────────────────────────
  async createPrescription(
    userId: string,
    formData: PrescriptionFormData
  ): Promise<Prescription> {
    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        user_id: userId,
        title: formData.title.trim(),
        doctor_name: formData.doctor_name.trim(),
        hospital_name: formData.hospital_name.trim(),
        description: formData.description?.trim() ?? null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status ?? 'active',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ── 4. Update Prescription ────────────────────────────────────
  async updatePrescription(
    id: string,
    formData: PrescriptionFormData
  ): Promise<Prescription> {
    const { data, error } = await supabase
      .from('prescriptions')
      .update({
        title: formData.title.trim(),
        doctor_name: formData.doctor_name.trim(),
        hospital_name: formData.hospital_name.trim(),
        description: formData.description?.trim() ?? null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: formData.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ── 5. Delete Prescription ────────────────────────────────────
  async deletePrescription(id: string): Promise<void> {
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
