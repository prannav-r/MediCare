// ============================================================
// src/services/providers/ExternalMedicineProvider.ts
// External API Implementation Placeholder for MedicineSearchProvider.
//
// WHY THIS PROVIDER?
// Designed so any external pharmaceutical database (OpenFDA, RxNorm,
// 1mg, PharmEasy, National Drug Database) can be plugged in later
// without requiring any UI or routing changes.
// ============================================================

import type { MedicineCatalogItem } from '@/types'
import type { MedicineSearchProvider } from './MedicineSearchProvider'

export class ExternalMedicineProvider implements MedicineSearchProvider {
  // Placeholder implementation: currently returns empty results until an API key/client is plugged in.
  // When an external medicine is selected, createMedicine() can persist it into local medicine_catalog.
  async searchMedicines(_query: string): Promise<MedicineCatalogItem[]> {
    // Future integration point:
    // const results = await fetch(`https://api.fda.gov/drug/label.json?search=${_query}`)
    return []
  }

  async getMedicineDetails(_id: string): Promise<MedicineCatalogItem | null> {
    return null
  }

  async createMedicine(
    data: Partial<MedicineCatalogItem> & { medicine_name: string }
  ): Promise<MedicineCatalogItem> {
    // If an external item needs to be created manually, construct an object adhering to the schema
    return {
      id: `ext-${Date.now()}`,
      external_id: data.external_id ?? null,
      medicine_name: data.medicine_name,
      generic_name: data.generic_name ?? null,
      brand_name: data.brand_name ?? null,
      strength: data.strength ?? null,
      dosage_form: data.dosage_form ?? null,
      manufacturer: data.manufacturer ?? null,
      source: 'external_api',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}
