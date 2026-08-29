// ============================================================
// src/hooks/usePrescriptionItems.ts
// TanStack Query hooks for Prescription Items (MVP 3)
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionItemService } from '@/services/prescriptionItemService'
import type { PrescriptionItemWithMedicine } from '@/types'
import type { PrescriptionItemFormData } from '@/schemas'

export const prescriptionItemKeys = {
  all: ['prescription_items'] as const,
  byPrescription: (prescriptionId: string) =>
    [...prescriptionItemKeys.all, 'byPrescription', prescriptionId] as const,
  activeForUser: (userId: string) =>
    [...prescriptionItemKeys.all, 'activeForUser', userId] as const,
  detail: (id: string) => [...prescriptionItemKeys.all, 'detail', id] as const,
}

export function usePrescriptionItems(prescriptionId: string | undefined) {
  return useQuery<PrescriptionItemWithMedicine[]>({
    queryKey: prescriptionId
      ? prescriptionItemKeys.byPrescription(prescriptionId)
      : ['prescription_items', 'none'],
    queryFn: () => prescriptionItemService.getItemsByPrescription(prescriptionId!),
    enabled: !!prescriptionId,
    staleTime: 30 * 1000,
  })
}

export function useAllActivePrescriptionItems(userId: string | undefined) {
  return useQuery<PrescriptionItemWithMedicine[]>({
    queryKey: userId
      ? prescriptionItemKeys.activeForUser(userId)
      : ['prescription_items', 'active', 'anonymous'],
    queryFn: () => prescriptionItemService.getAllActiveItemsForUser(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function usePrescriptionItem(id: string | undefined) {
  return useQuery<PrescriptionItemWithMedicine>({
    queryKey: id ? prescriptionItemKeys.detail(id) : ['prescription_items', 'detail', 'none'],
    queryFn: () => prescriptionItemService.getItemById(id!),
    enabled: !!id,
  })
}

export function useCreatePrescriptionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      prescriptionId,
      formData,
      totalRequiredDoses,
    }: {
      prescriptionId: string
      formData: PrescriptionItemFormData
      totalRequiredDoses: number
    }) => prescriptionItemService.createItem(prescriptionId, formData, totalRequiredDoses),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.all })
      void queryClient.invalidateQueries({
        queryKey: ['prescriptions', 'detail', variables.prescriptionId],
      })
    },
  })
}

export function useUpdatePrescriptionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      formData,
      totalRequiredDoses,
    }: {
      id: string
      formData: PrescriptionItemFormData
      totalRequiredDoses: number
    }) => prescriptionItemService.updateItem(id, formData, totalRequiredDoses),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.all })
    },
  })
}

export function useDeletePrescriptionItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => prescriptionItemService.deleteItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionItemKeys.all })
    },
  })
}
