// ============================================================
// src/hooks/useInventory.ts
// TanStack Query hooks for Medicine Inventory.
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryService } from '@/services/inventoryService'
import type { MedicineInventory, MedicineInventoryWithMedicine } from '@/types'

export const inventoryKeys = {
  all: ['inventory'] as const,
  byUser: (userId: string) => [...inventoryKeys.all, 'byUser', userId] as const,
  byMedicine: (userId: string, medicineId: string) => [...inventoryKeys.all, 'byMedicine', userId, medicineId] as const,
}

export function useInventoryItem(userId: string | undefined, medicineId: string | undefined) {
  return useQuery<MedicineInventory | null>({
    queryKey: userId && medicineId ? inventoryKeys.byMedicine(userId, medicineId) : ['inventory', 'none'],
    queryFn: () => inventoryService.getInventory(userId!, medicineId!),
    enabled: !!userId && !!medicineId,
  })
}

export function useAllInventory(userId: string | undefined) {
  return useQuery<MedicineInventoryWithMedicine[]>({
    queryKey: userId ? inventoryKeys.byUser(userId) : ['inventory', 'none'],
    queryFn: () => inventoryService.getAllInventory(userId!),
    enabled: !!userId,
  })
}

export function useSetInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, medicineId, currentDoses }: { userId: string; medicineId: string; currentDoses: number }) =>
      inventoryService.setInventory(userId, medicineId, currentDoses),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.byUser(variables.userId) })
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.byMedicine(variables.userId, variables.medicineId) })
    },
  })
}
