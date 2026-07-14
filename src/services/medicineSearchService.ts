// ============================================================
// src/services/medicineSearchService.ts
// Provider Pattern Orchestrator for Medicine Search & Catalog.
//
// WHY THIS SERVICE?
// The UI ONLY imports and calls this service.
// Flow:
//   1. Search LocalCatalogProvider.
//   2. If local results are empty or insufficient, search ExternalMedicineProvider.
//   3. If medicine is still not found, allow manual creation into local catalog via createMedicine().
// ============================================================

import type { MedicineCatalogItem } from '@/types'
import { ExternalMedicineProvider } from './providers/ExternalMedicineProvider'
import { LocalCatalogProvider } from './providers/LocalCatalogProvider'
import type { MedicineSearchProvider } from './providers/MedicineSearchProvider'

class MedicineSearchService {
  private localProvider: MedicineSearchProvider
  private externalProvider: MedicineSearchProvider

  constructor(
    local: MedicineSearchProvider = new LocalCatalogProvider(),
    external: MedicineSearchProvider = new ExternalMedicineProvider()
  ) {
    this.localProvider = local
    this.externalProvider = external
  }

  /**
   * Orchestrates search across local and external catalog providers.
   */
  async search(query: string): Promise<MedicineCatalogItem[]> {
    const localResults = await this.localProvider.searchMedicines(query)

    // If local results found, return them
    if (localResults.length > 0) {
      return localResults
    }

    // Otherwise query external provider (placeholder integration)
    const externalResults = await this.externalProvider.searchMedicines(query)
    return externalResults
  }

  /**
   * Retrieves full details for a specific medicine catalog item.
   */
  async getDetails(id: string): Promise<MedicineCatalogItem | null> {
    const local = await this.localProvider.getMedicineDetails(id)
    if (local) return local
    return this.externalProvider.getMedicineDetails(id)
  }

  /**
   * Persists a newly created manual medicine into the local catalog.
   */
  async createManualMedicine(
    data: Partial<MedicineCatalogItem> & { medicine_name: string }
  ): Promise<MedicineCatalogItem> {
    return this.localProvider.createMedicine({
      ...data,
      source: 'manual',
    })
  }
}

export const medicineSearchService = new MedicineSearchService()
