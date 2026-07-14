// ============================================================
// src/utils/adherenceAnalytics.ts
// Adherence Calculation & Streak Analytics Engine
// Updated for Prescription Domain Model (prescription_item_id).
// ============================================================

import type {
  MedicationLog,
  PrescriptionItemWithMedicine,
} from '@/types'

export interface AdherenceStats {
  overallAdherence: number
  weeklyAdherence: number
  monthlyAdherence: number
  currentStreak: number
  longestStreak: number
  totalTaken: number
  totalMissed: number
  totalPending: number
  mostConsistentMedicine: string | null
  mostMissedMedicine: string | null
  medicineBreakdown: {
    itemId: string
    medicineName: string
    dosage: string
    taken: number
    missed: number
    adherence: number
  }[]
}

/**
 * Calculates comprehensive adherence statistics and streaks
 * from the user's medication log history across prescription items.
 */
export function calculateAdherenceStats(
  logs: MedicationLog[],
  items: PrescriptionItemWithMedicine[]
): AdherenceStats {
  if (logs.length === 0) {
    return {
      overallAdherence: 100,
      weeklyAdherence: 100,
      monthlyAdherence: 100,
      currentStreak: 0,
      longestStreak: 0,
      totalTaken: 0,
      totalMissed: 0,
      totalPending: 0,
      mostConsistentMedicine: null,
      mostMissedMedicine: null,
      medicineBreakdown: [],
    }
  }

  // 1. Overall status counts
  let totalTaken = 0
  let totalMissed = 0
  let totalPending = 0

  for (const log of logs) {
    if (log.status === 'taken') totalTaken++
    else if (log.status === 'missed') totalMissed++
    else if (log.status === 'pending') totalPending++
  }

  const evaluatedCount = totalTaken + totalMissed
  const overallAdherence =
    evaluatedCount > 0 ? Math.round((totalTaken / evaluatedCount) * 100) : 100

  // 2. Date window filtering (Weekly & Monthly)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  let weeklyTaken = 0
  let weeklyEvaluated = 0
  let monthlyTaken = 0
  let monthlyEvaluated = 0

  for (const log of logs) {
    if (log.scheduled_date >= sevenDaysAgo) {
      if (log.status === 'taken' || log.status === 'missed') {
        weeklyEvaluated++
        if (log.status === 'taken') weeklyTaken++
      }
    }
    if (log.scheduled_date >= thirtyDaysAgo) {
      if (log.status === 'taken' || log.status === 'missed') {
        monthlyEvaluated++
        if (log.status === 'taken') monthlyTaken++
      }
    }
  }

  const weeklyAdherence =
    weeklyEvaluated > 0 ? Math.round((weeklyTaken / weeklyEvaluated) * 100) : 100
  const monthlyAdherence =
    monthlyEvaluated > 0
      ? Math.round((monthlyTaken / monthlyEvaluated) * 100)
      : 100

  // 3. Streak Calculations across unique logged dates
  const dateMap = new Map<string, { taken: number; missed: number }>()
  for (const log of logs) {
    const existing = dateMap.get(log.scheduled_date) ?? { taken: 0, missed: 0 }
    if (log.status === 'taken') existing.taken++
    if (log.status === 'missed') existing.missed++
    dateMap.set(log.scheduled_date, existing)
  }

  const sortedDates = Array.from(dateMap.keys()).sort().reverse()

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let checkingCurrent = true

  for (const dateStr of sortedDates) {
    const stats = dateMap.get(dateStr)!
    if (stats.taken > 0 && stats.missed === 0) {
      tempStreak++
      if (checkingCurrent) currentStreak = tempStreak
      if (tempStreak > longestStreak) longestStreak = tempStreak
    } else {
      checkingCurrent = false
      tempStreak = 0
    }
  }

  // 4. Per-Item Breakdown
  const itemMap = new Map<
    string,
    { name: string; dosage: string; taken: number; missed: number }
  >()
  for (const item of items) {
    if (item.medicine) {
      itemMap.set(item.id, {
        name: item.medicine.medicine_name,
        dosage: item.dosage,
        taken: 0,
        missed: 0,
      })
    }
  }

  for (const log of logs) {
    const targetId = log.prescription_item_id || (log as unknown as { medicine_id?: string }).medicine_id
    if (!targetId) continue
    const entry = itemMap.get(targetId)
    if (entry) {
      if (log.status === 'taken') entry.taken++
      else if (log.status === 'missed') entry.missed++
    }
  }

  const medicineBreakdown = Array.from(itemMap.entries()).map(
    ([id, { name, dosage, taken, missed }]) => {
      const evalCount = taken + missed
      const adherence =
        evalCount > 0 ? Math.round((taken / evalCount) * 100) : 100
      return {
        itemId: id,
        medicineName: name,
        dosage,
        taken,
        missed,
        adherence,
      }
    }
  )

  medicineBreakdown.sort((a, b) => b.adherence - a.adherence)

  const mostConsistentMedicine =
    medicineBreakdown.length > 0 && medicineBreakdown[0].taken > 0
      ? medicineBreakdown[0].medicineName
      : null

  const missedSorted = [...medicineBreakdown].sort((a, b) => b.missed - a.missed)
  const mostMissedMedicine =
    missedSorted.length > 0 && missedSorted[0].missed > 0
      ? missedSorted[0].medicineName
      : null

  return {
    overallAdherence,
    weeklyAdherence,
    monthlyAdherence,
    currentStreak,
    longestStreak,
    totalTaken,
    totalMissed,
    totalPending,
    mostConsistentMedicine,
    mostMissedMedicine,
    medicineBreakdown,
  }
}
