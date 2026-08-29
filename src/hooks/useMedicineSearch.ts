// ============================================================
// src/hooks/useMedicineSearch.ts
// TanStack Query hooks for Medicine Catalog search.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { medicineService } from '@/services/medicineService'
import type { MedicineCatalogFormData } from '@/schemas'

export const medicineSearchKeys = {
  all: ['medicine_catalog'] as const,
  search: (query: string) => [...medicineSearchKeys.all, 'search', query] as const,
}

export function useSearchMedicineCatalog(query: string) {
  return useQuery({
    queryKey: medicineSearchKeys.search(query),
    queryFn: () => medicineService.searchMedicines(query),
    enabled: query.trim().length > 0,
    staleTime: 60 * 1000,
  })
}

export function useCreateManualMedicine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: MedicineCatalogFormData) =>
      medicineService.createMedicine(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: medicineSearchKeys.all })
    },
  })
}
