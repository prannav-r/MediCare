// ============================================================
// src/lib/utils.ts
// Utility functions shared across the app.
// ============================================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// cn() = "class names"
// This is the standard shadcn/ui utility.
// It combines clsx (conditional classes) + tailwind-merge (dedup conflicts).
//
// Example:
//   cn('px-4 py-2', isActive && 'bg-primary', 'px-6')
//   → 'py-2 bg-primary px-6'  (px-4 is overridden by px-6 via twMerge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Time Formatting ──────────────────────────────────────────

// Convert "HH:MM" (24h) to "HH:MM AM/PM" display format
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':')
  const hour = parseInt(hourStr, 10)
  const minute = minuteStr
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12 // convert 0 → 12
  return `${displayHour}:${minute} ${period}`
}

// Format date string to readable format
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Stock Status ─────────────────────────────────────────────
export function getStockStatus(stock: number): 'critical' | 'low' | 'ok' {
  if (stock === 0) return 'critical'
  if (stock <= 5) return 'low'
  return 'ok'
}
