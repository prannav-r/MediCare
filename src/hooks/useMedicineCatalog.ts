// ============================================================
// src/hooks/useMedicineCatalog.ts
// TanStack Query hooks for searching and creating catalog medicines.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { medicineSearchService } from '@/services/medicineSearchService'
import type { MedicineCatalogItem } from '@/types'

export const medicineCatalogKeys = {
  all: ['medicine_catalog'] as const,
  search: (query: string) => [...medicineCatalogKeys.all, 'search', query] as const,
  detail: (id: string) => [...medicineCatalogKeys.all, 'detail', id] as const,
}

export function useSearchMedicineCatalog(query: string) {
  return useQuery<MedicineCatalogItem[]>({
    queryKey: medicineCatalogKeys.search(query),
    queryFn: () => medicineSearchService.search(query),
    staleTime: 60 * 1000,
  })
}

export function useCreateManualMedicine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<MedicineCatalogItem> & { medicine_name: string }) =>
      medicineSearchService.createManualMedicine(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: medicineCatalogKeys.all,
      })
    },
  })
}
