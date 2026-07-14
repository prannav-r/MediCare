// ============================================================
// src/hooks/useMedicines.ts
// Compatibility shim hooks delegating to usePrescriptionItems.
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { medicineService } from '@/services/medicineService'
import { useAuth } from '@/contexts/AuthContext'
import type { Medicine } from '@/types'

export function useMedicines() {
  const { user } = useAuth()
  return useQuery<Medicine[]>({
    queryKey: ['medicines', user?.id],
    queryFn: () => medicineService.getMedicines(user!.id),
    enabled: !!user?.id,
  })
}

export function useDeleteMedicine() {
  return {
    mutateAsync: async (id: string) => medicineService.deleteMedicine(id),
    isPending: false,
  }
}
