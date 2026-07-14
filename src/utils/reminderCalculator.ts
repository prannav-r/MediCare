// ============================================================
// src/utils/reminderCalculator.ts
// Smart Reminder Time Calculation Engine
//
// WHY THIS FILE?
// Instead of hardcoding static times or duplicating time math across
// multiple components, this utility serves as the single source of
// truth for transforming user meal timings + food relations into
// exact scheduled 24-hour ("HH:MM") reminder times.
//
// RULES IMPLEMENTED:
//   Before Food → Meal Time - 30 minutes
//   After Food  → Meal Time + 30 minutes
//   With Food   → Meal Time exactly
//   Anytime     → User's custom selected time
// ============================================================

import type { FoodRelation, MealType, Profile } from '@/types'

/**
 * Parses an "HH:MM" string into minutes since midnight.
 * Example: "08:30" -> 510
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map((n) => parseInt(n, 10))
  return (hours || 0) * 60 + (minutes || 0)
}

/**
 * Converts minutes since midnight back to "HH:MM" 24-hour format.
 * Handles wrapping around midnight (0-1439 minutes).
 * Example: 510 -> "08:30"
 */
export function minutesToTime(totalMinutes: number): string {
  // Normalize minutes into 0..1439 range
  const normalized = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(normalized / 60)
  const minutes = normalized % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

/**
 * Adds or subtracts offsetMinutes from an "HH:MM" string.
 */
export function adjustTime(timeStr: string, offsetMinutes: number): string {
  const mins = timeToMinutes(timeStr)
  return minutesToTime(mins + offsetMinutes)
}

/**
 * Calculates the exact reminder time ("HH:MM") for a medicine
 * given the user's profile meal schedule.
 *
 * @param mealType      Which meal ("breakfast" | "lunch" | "dinner")
 * @param foodRelation  When relative to meal ("before_food" | "after_food" | "with_food" | "anytime")
 * @param customTime    Custom time string if foodRelation === 'anytime'
 * @param profile       User profile containing breakfast_time, lunch_time, dinner_time
 */
export function calculateReminderTime(
  mealType: MealType,
  foodRelation: FoodRelation,
  customTime: string | null,
  profile: Profile | null
): string {
  // 1. If "Anytime", use custom_time or default to 09:00
  if (foodRelation === 'anytime') {
    return customTime && customTime.length >= 5 ? customTime.slice(0, 5) : '09:00'
  }

  // 2. Determine base meal time from profile (with fallback defaults)
  let baseTime = '08:00'
  if (profile) {
    if (mealType === 'breakfast') baseTime = profile.breakfast_time || '08:00'
    else if (mealType === 'lunch') baseTime = profile.lunch_time || '13:00'
    else if (mealType === 'dinner') baseTime = profile.dinner_time || '20:00'
  } else {
    if (mealType === 'breakfast') baseTime = '08:00'
    else if (mealType === 'lunch') baseTime = '13:00'
    else if (mealType === 'dinner') baseTime = '20:00'
  }

  // Ensure base time is cleanly formatted to HH:MM
  const cleanBaseTime = baseTime.slice(0, 5)

  // 3. Apply relation rule (-30m, +30m, or +0m)
  switch (foodRelation) {
    case 'before_food':
      return adjustTime(cleanBaseTime, -30)
    case 'after_food':
      return adjustTime(cleanBaseTime, 30)
    case 'with_food':
    default:
      return cleanBaseTime
  }
}

/**
 * Checks if a given scheduled date ("YYYY-MM-DD") and scheduled time ("HH:MM")
 * is strictly in the past compared to the current system time.
 */
export function isTimeInPast(scheduledDate: string, scheduledTime: string): boolean {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]

  if (scheduledDate < todayStr) return true
  if (scheduledDate > todayStr) return false

  // If scheduledDate === today, compare HH:MM
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const scheduledMinutes = timeToMinutes(scheduledTime)

  return currentMinutes > scheduledMinutes
}
