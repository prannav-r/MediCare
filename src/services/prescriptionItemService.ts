// ============================================================
// src/services/prescriptionItemService.ts
// Service layer for Prescription Items (joining medicine catalog & parent prescription).
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
      .select('*, medicine:medicine_catalog(*), prescription:prescriptions(*)')
      .eq('prescription_id', prescriptionId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data as unknown as PrescriptionItemWithMedicine[]) ?? []
  },

  // ── 2. Get All Active Items Across All User Prescriptions ─────
  async getAllActiveItemsForUser(
    userId: string
  ): Promise<PrescriptionItemWithMedicine[]> {
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*, medicine:medicine_catalog(*), prescription:prescriptions!inner(*)')
      .eq('prescription.user_id', userId)
      .eq('prescription.status', 'active')

    if (error) throw error
    return (data as unknown as PrescriptionItemWithMedicine[]) ?? []
  },

  // ── 3. Get Single Item by ID ──────────────────────────────────
  async getItemById(id: string): Promise<PrescriptionItemWithMedicine> {
    const { data, error } = await supabase
      .from('prescription_items')
      .select('*, medicine:medicine_catalog(*), prescription:prescriptions(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as PrescriptionItemWithMedicine
  },

  // ── 4. Add Item to Prescription ───────────────────────────────
  async createItem(
    prescriptionId: string,
    formData: PrescriptionItemFormData
  ): Promise<PrescriptionItem> {
    const basePayload = {
      prescription_id: prescriptionId,
      medicine_id: formData.medicine_id,
      dosage: formData.dosage.trim(),
      meal_type: (formData.meal_types && formData.meal_types[0]) || formData.meal_type,
      food_relation: formData.food_relation,
      custom_time: formData.food_relation === 'anytime' ? formData.custom_time ?? null : null,
      daily_frequency: formData.daily_frequency,
      quantity_per_dose: formData.quantity_per_dose,
      remaining_stock: formData.remaining_stock,
      notes: formData.notes?.trim() ?? null,
    }

    const fullPayload = {
      ...basePayload,
      meal_types: formData.meal_types && formData.meal_types.length > 0 ? formData.meal_types : [formData.meal_type],
      total_quantity_prescribed: formData.remaining_stock,
    }

    const { data, error } = await supabase
      .from('prescription_items')
      .insert(fullPayload)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        console.warn('DB schema missing column, retrying insert with base payload:', error.message)
        const { data: retryData, error: retryError } = await supabase
          .from('prescription_items')
          .insert(basePayload)
          .select()
          .single()

        if (retryError) {
          console.error('Supabase error creating item (retry):', retryError)
          throw new Error(retryError.message || 'Failed to add medicine item')
        }
        return retryData as PrescriptionItem
      }

      console.error('Supabase error creating item:', error)
      throw new Error(error.message || 'Failed to add medicine item')
    }

    return data
  },

  // ── 5. Update Prescription Item ───────────────────────────────
  async updateItem(
    id: string,
    formData: PrescriptionItemFormData
  ): Promise<PrescriptionItem> {
    const basePayload = {
      medicine_id: formData.medicine_id,
      dosage: formData.dosage.trim(),
      meal_type: (formData.meal_types && formData.meal_types[0]) || formData.meal_type,
      food_relation: formData.food_relation,
      custom_time: formData.food_relation === 'anytime' ? formData.custom_time ?? null : null,
      daily_frequency: formData.daily_frequency,
      quantity_per_dose: formData.quantity_per_dose,
      remaining_stock: formData.remaining_stock,
      notes: formData.notes?.trim() ?? null,
    }

    const fullPayload = {
      ...basePayload,
      meal_types: formData.meal_types && formData.meal_types.length > 0 ? formData.meal_types : [formData.meal_type],
    }

    const { data, error } = await supabase
      .from('prescription_items')
      .update(fullPayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('column')) {
        console.warn('DB schema missing column, retrying update with base payload:', error.message)
        const { data: retryData, error: retryError } = await supabase
          .from('prescription_items')
          .update(basePayload)
          .eq('id', id)
          .select()
          .single()

        if (retryError) {
          console.error('Supabase error updating item (retry):', retryError)
          throw new Error(retryError.message || 'Failed to update medicine item')
        }
        return retryData as PrescriptionItem
      }

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
