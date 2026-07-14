// ============================================================
// src/services/providers/LocalCatalogProvider.ts
// Local Supabase implementation of MedicineSearchProvider.
//
// WHY THIS PROVIDER?
// Searches and stores master medicine definitions inside the local
// PostgreSQL `medicine_catalog` table. The entire application works
// completely autonomously using this provider.
// ============================================================

import { supabase } from '@/lib/supabase'
import type { MedicineCatalogItem } from '@/types'
import type { MedicineSearchProvider } from './MedicineSearchProvider'

export class LocalCatalogProvider implements MedicineSearchProvider {
  async searchMedicines(query: string): Promise<MedicineCatalogItem[]> {
    const trimmed = query.trim()
    let request = supabase.from('medicine_catalog').select('*')

    if (trimmed) {
      request = request.ilike('medicine_name', `%${trimmed}%`)
    }

    const { data, error } = await request
      .order('medicine_name', { ascending: true })
      .limit(30)

    if (error) throw error
    return data ?? []
  }

  async getMedicineDetails(id: string): Promise<MedicineCatalogItem | null> {
    const { data, error } = await supabase
      .from('medicine_catalog')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async createMedicine(
    data: Partial<MedicineCatalogItem> & { medicine_name: string }
  ): Promise<MedicineCatalogItem> {
    const { data: created, error } = await supabase
      .from('medicine_catalog')
      .insert({
        medicine_name: data.medicine_name.trim(),
        generic_name: data.generic_name ?? null,
        brand_name: data.brand_name ?? null,
        strength: data.strength ?? null,
        dosage_form: data.dosage_form ?? null,
        manufacturer: data.manufacturer ?? null,
        source: data.source ?? 'manual',
      })
      .select()
      .single()

    if (error) throw error
    return created
  }
}
