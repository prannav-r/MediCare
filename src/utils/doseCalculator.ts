// ============================================================
// src/utils/doseCalculator.ts
// Utility functions for deterministic dose calculations.
// ============================================================

import { FIXED_SCHEDULE } from '@/types'

export interface DoseCalculationResult {
  durationDays: number
  dosesPerDay: number
  totalRequired: number
}

/**
 * Parses a YYYY-MM-DD date string as a local date at 00:00:00.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Calculates the total number of required doses for a prescription item.
 */
export function calculateRequiredDoses(
  startDateStr: string,
  endDateStr: string,
  morning: boolean,
  afternoon: boolean,
  evening: boolean,
  quantityPerDose: number = 1
): DoseCalculationResult {
  const start = parseLocalDate(startDateStr)
  const end = parseLocalDate(endDateStr)
  
  // Calculate inclusive duration in days
  const durationMs = end.getTime() - start.getTime()
  const durationDays = Math.max(0, Math.floor(durationMs / (1000 * 60 * 60 * 24))) + 1
  
  const doseTimesPerDay = (morning ? 1 : 0) + (afternoon ? 1 : 0) + (evening ? 1 : 0)
  const dosesPerDay = doseTimesPerDay * quantityPerDose
  const totalRequired = durationDays * dosesPerDay
  
  return {
    durationDays,
    dosesPerDay,
    totalRequired
  }
}

/**
 * Calculates how many doses have been consumed based on the current local time.
 */
export function calculateConsumedDoses(
  startDateStr: string,
  endDateStr: string,
  morning: boolean,
  afternoon: boolean,
  evening: boolean,
  quantityPerDose: number = 1
): number {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  const start = parseLocalDate(startDateStr)
  const end = parseLocalDate(endDateStr)
  const today = parseLocalDate(todayStr)

  if (now.getTime() < start.getTime()) {
    // Prescription hasn't started yet
    return 0
  }

  // Cap the calculation day to the end date if the prescription has already finished
  const effectiveEnd = now.getTime() > end.getTime() + (24 * 60 * 60 * 1000 - 1) ? end : today

  // Calculate full days passed entirely
  const fullDaysMs = effectiveEnd.getTime() - start.getTime()
  const fullDaysPassed = Math.max(0, Math.floor(fullDaysMs / (1000 * 60 * 60 * 24)))
  
  const doseTimesPerDay = (morning ? 1 : 0) + (afternoon ? 1 : 0) + (evening ? 1 : 0)
  const dosesPerDay = doseTimesPerDay * quantityPerDose
  let consumed = fullDaysPassed * dosesPerDay

  // If the prescription is still ongoing today (and today is <= end date),
  // we add the doses that have passed TODAY.
  if (effectiveEnd.getTime() === today.getTime()) {
    const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    if (morning && currentHourMinute >= FIXED_SCHEDULE.morning) {
      consumed += quantityPerDose
    }
    if (afternoon && currentHourMinute >= FIXED_SCHEDULE.afternoon) {
      consumed += quantityPerDose
    }
    if (evening && currentHourMinute >= FIXED_SCHEDULE.evening) {
      consumed += quantityPerDose
    }
  }

  return consumed
}

export interface InventoryStatus {
  remainingRequired: number
  shortage: number
  isLowStock: boolean
}

/**
 * Determines low stock status for an active prescription item.
 */
export function getInventoryStatus(
  currentInventory: number,
  totalRequired: number,
  consumedDoses: number
): InventoryStatus {
  const remainingRequired = Math.max(0, totalRequired - consumedDoses)
  const shortage = Math.max(0, remainingRequired - currentInventory)
  
  return {
    remainingRequired,
    shortage,
    isLowStock: shortage > 0
  }
}
