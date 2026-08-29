// ============================================================
// src/services/medicineService.ts
// Service layer for Medicine Catalog.
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Medicine } from '@/types'
import type { MedicineCatalogFormData } from '@/schemas'

export const medicineService = {
  /**
   * Search local medicine catalog by name.
   */
  async searchMedicines(query: string): Promise<Medicine[]> {
    if (!query.trim()) return []

    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .ilike('medicine_name', `%${query.trim()}%`)
      .order('medicine_name', { ascending: true })
      .limit(10)

    if (error) throw error
    return data ?? []
  },

  /**
   * Get single medicine from catalog by ID.
   */
  async getMedicineById(id: string): Promise<Medicine> {
    const { data, error } = await supabase
      .from('medicines')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new medicine in the catalog.
   */
  async createMedicine(formData: MedicineCatalogFormData): Promise<Medicine> {
    const { data, error } = await supabase
      .from('medicines')
      .insert({
        medicine_name: formData.medicine_name.trim(),
        generic_name: formData.generic_name?.trim() ?? null,
        brand_name: formData.brand_name?.trim() ?? null,
        strength: formData.strength?.trim() ?? null,
        dosage_form: formData.dosage_form?.trim() ?? null,
        manufacturer: formData.manufacturer?.trim() ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },
}
