// ============================================================
// src/hooks/useMedicationLogs.ts
// TanStack Query hooks for medication tracking under Prescription Domain.
// ============================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { logService } from '@/services/logService'
import type {
  DailyScheduleItem,
  LogStatus,
  MedicationLog,
  PrescriptionItemWithMedicine,
  Profile,
} from '@/types'

export const medicationLogKeys = {
  all: ['medication_logs'] as const,
  range: (userId: string, start: string, end: string) =>
    [...medicationLogKeys.all, 'range', userId, start, end] as const,
  daily: (userId: string, date: string) =>
    [...medicationLogKeys.all, 'daily', userId, date] as const,
}

export function useDailySchedule(
  userId: string | undefined,
  dateStr: string,
  items: PrescriptionItemWithMedicine[] | undefined,
  profile: Profile | null | undefined
) {
  return useQuery<DailyScheduleItem[]>({
    queryKey: userId
      ? medicationLogKeys.daily(userId, dateStr)
      : ['medication_logs', 'daily', 'anonymous'],
    queryFn: () =>
      logService.getDailySchedule(userId!, dateStr, items ?? [], profile ?? null),
    enabled: !!userId && !!items,
    staleTime: 15 * 1000,
  })
}

export function useLogsByDateRange(
  userId: string | undefined,
  startDate: string,
  endDate: string
) {
  return useQuery<MedicationLog[]>({
    queryKey: userId
      ? medicationLogKeys.range(userId, startDate, endDate)
      : ['medication_logs', 'range', 'anonymous'],
    queryFn: () => logService.getLogsByDateRange(userId!, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate,
    staleTime: 30 * 1000,
  })
}

export function useUpsertLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      userId: string
      prescriptionItemId: string
      scheduledDate: string
      scheduledTime: string
      status: LogStatus
      notes?: string | null
    }) => logService.upsertLog(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: medicationLogKeys.all,
      })
    },
  })
}
