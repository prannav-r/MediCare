// ============================================================
// src/hooks/usePrescriptions.ts
// TanStack Query hooks for Prescriptions.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionService } from '@/services/prescriptionService'
import type { Prescription } from '@/types'
import type { PrescriptionFormData } from '@/schemas'

export const prescriptionKeys = {
  all: ['prescriptions'] as const,
  list: (userId: string) => [...prescriptionKeys.all, 'list', userId] as const,
  detail: (id: string) => [...prescriptionKeys.all, 'detail', id] as const,
}

export function usePrescriptions(userId: string | undefined) {
  return useQuery<Prescription[]>({
    queryKey: userId ? prescriptionKeys.list(userId) : ['prescriptions', 'anonymous'],
    queryFn: () => prescriptionService.getPrescriptions(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  })
}

export function usePrescription(id: string | undefined) {
  return useQuery<Prescription>({
    queryKey: id ? prescriptionKeys.detail(id) : ['prescriptions', 'detail', 'none'],
    queryFn: () => prescriptionService.getPrescriptionById(id!),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, formData }: { userId: string; formData: PrescriptionFormData }) =>
      prescriptionService.createPrescription(userId, formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all })
    },
  })
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: PrescriptionFormData }) =>
      prescriptionService.updatePrescription(id, formData),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all })
      void queryClient.invalidateQueries({
        queryKey: prescriptionKeys.detail(variables.id),
      })
    },
  })
}

export function useDeletePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => prescriptionService.deletePrescription(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: prescriptionKeys.all })
    },
  })
}
