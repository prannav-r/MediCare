// ============================================================
// src/services/prescriptionItemService.ts
// Service layer for Prescription Items (MVP 3)
// ============================================================

import { supabase } from '@/lib/supabase'
import type { PrescriptionItem, PrescriptionItemWithMedicine } from '@/types'
import type { PrescriptionItemFormData } from '@/schemas'

export const prescriptionItemService = {
  // ── 1. Get All Items for a Specific Prescription ──────────────
  async getItemsByPrescription(
    prescriptionId: string
  ): Promise<PrescriptionItemWithMedicine[]> {
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*, medicine:medicines(*), prescription:prescriptions(*)')
      .eq('prescription_id', prescriptionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data as unknown as PrescriptionItemWithMedicine[]) ?? []
  },

  // ── 2. Get All Active Items Across All User Prescriptions ─────
  async getAllActiveItemsForUser(
    userId: string
  ): Promise<PrescriptionItemWithMedicine[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*, medicine:medicines(*), prescription:prescriptions!inner(*)')
      .eq('prescription.user_id', userId)
      .lte('prescription.start_date', today)
      .gte('prescription.end_date', today)

    if (error) throw error
    return (data as unknown as PrescriptionItemWithMedicine[]) ?? []
  },

  // ── 3. Get Single Item by ID ──────────────────────────────────
  async getItemById(id: string): Promise<PrescriptionItemWithMedicine> {
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*, medicine:medicines(*), prescription:prescriptions(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as PrescriptionItemWithMedicine
  },

  // ── 4. Add Item to Prescription ───────────────────────────────
  async createItem(
    prescriptionId: string,
    formData: PrescriptionItemFormData,
    totalRequiredDoses: number
  ): Promise<PrescriptionItem> {
    const payload = {
      prescription_id: prescriptionId,
      medicine_id: formData.medicine_id,
      morning: formData.morning,
      afternoon: formData.afternoon,
      evening: formData.evening,
      total_required_doses: totalRequiredDoses,
    }

    const { data, error } = await supabase
      .from('prescription_items')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating item:', error)
      throw new Error(error.message || 'Failed to add medicine item')
    }

    return data
  },

  // ── 5. Update Prescription Item ───────────────────────────────
  async updateItem(
    id: string,
    formData: PrescriptionItemFormData,
    totalRequiredDoses: number
  ): Promise<PrescriptionItem> {
    const payload = {
      medicine_id: formData.medicine_id,
      morning: formData.morning,
      afternoon: formData.afternoon,
      evening: formData.evening,
      total_required_doses: totalRequiredDoses,
    }

    const { data, error } = await supabase
      .from('prescription_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error updating item:', error)
      throw new Error(error.message || 'Failed to update medicine item')
    }

    return data
  },

  // ── 6. Delete Item ────────────────────────────────────────────
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('prescription_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
