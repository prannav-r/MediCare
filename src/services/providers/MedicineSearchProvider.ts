// ============================================================
// src/services/providers/MedicineSearchProvider.ts
// Provider Pattern Interface Contract for Medicine Search.
//
// WHY THIS INTERFACE?
// Ensures the UI NEVER communicates directly with the database
// or external APIs. Any provider (Local Supabase catalog, OpenFDA,
// RxNorm, 1mg) implementing this interface can be plugged in seamlessly.
// ============================================================

import type { MedicineCatalogItem } from '@/types'

export interface MedicineSearchProvider {
  /**
   * Search medicines by name or keyword query.
   * Returns matching items from the catalog or external database.
   */
  searchMedicines(query: string): Promise<MedicineCatalogItem[]>

  /**
   * Fetch complete details for a specific medicine catalog ID.
   */
  getMedicineDetails(id: string): Promise<MedicineCatalogItem | null>

  /**
   * Create or persist a new manual medicine definition in the catalog.
   */
  createMedicine(
    data: Partial<MedicineCatalogItem> & { medicine_name: string }
  ): Promise<MedicineCatalogItem>
}
