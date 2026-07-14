// ============================================================
// src/services/logService.ts
// Service layer for Medication Tracking & Adherence History.
// Refactored for the Prescription Domain Model (linking prescription_item_id).
// ============================================================

import { supabase } from '@/lib/supabase'
import type {
  DailyScheduleItem,
  LogStatus,
  MedicationLog,
  PrescriptionItemWithMedicine,
  Profile,
} from '@/types'
import { calculateReminderTime, isTimeInPast } from '@/utils/reminderCalculator'

export const logService = {
  // ── 1. Fetch Logs for a Specific Date Range ──────────────────
  async getLogsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<MedicationLog[]> {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)

    if (error) throw error
    return data ?? []
  },

  // ── 2. Upsert a Medication Log (Mark Taken / Skipped / Missed) ──
  async upsertLog(params: {
    userId: string
    prescriptionItemId: string
    scheduledDate: string
    scheduledTime: string
    status: LogStatus
    notes?: string | null
  }): Promise<MedicationLog> {
    const takenAt =
      params.status === 'taken' ? new Date().toISOString() : null

    const payload = {
      user_id: params.userId,
      prescription_item_id: params.prescriptionItemId,
      scheduled_date: params.scheduledDate,
      scheduled_time: params.scheduledTime,
      status: params.status,
      taken_at: takenAt,
      notes: params.notes ?? null,
      updated_at: new Date().toISOString(),
    }

    // First check if an exact log already exists for this item + date + time
    const { data: existingExactLog } = await supabase
      .from('medication_logs')
      .select('id')
      .eq('prescription_item_id', params.prescriptionItemId)
      .eq('scheduled_date', params.scheduledDate)
      .eq('scheduled_time', params.scheduledTime)
      .maybeSingle()

    if (existingExactLog?.id) {
      const { data, error } = await supabase
        .from('medication_logs')
        .update({
          status: params.status,
          taken_at: takenAt,
          notes: params.notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingExactLog.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating medication log:', error)
        throw new Error(error.message || 'Failed to update dose status')
      }
      return data
    }

    // Try inserting new log
    const { data: insertedData, error: insertError } = await supabase
      .from('medication_logs')
      .insert(payload)
      .select()
      .single()

    if (insertError) {
      // If insert fails due to legacy 2-column unique constraint (prescription_item_id, scheduled_date),
      // update the existing log for that date instead
      if (insertError.code === '23505' || insertError.message?.includes('unique')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('medication_logs')
          .update({
            status: params.status,
            taken_at: takenAt,
            notes: params.notes ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('prescription_item_id', params.prescriptionItemId)
          .eq('scheduled_date', params.scheduledDate)
          .select()
          .single()

        if (fallbackError) {
          console.error('Error updating existing log on fallback:', fallbackError)
          throw new Error(fallbackError.message || 'Failed to update dose status')
        }
        return fallbackData
      }

      console.error('Error inserting medication log:', insertError)
      throw new Error(insertError.message || 'Failed to update dose status')
    }

    return insertedData
  },

  // ── 3. Build Daily Schedule & Auto-Handle Missed Doses ───────
  async getDailySchedule(
    userId: string,
    dateStr: string,
    items: PrescriptionItemWithMedicine[],
    profile: Profile | null
  ): Promise<DailyScheduleItem[]> {
    if (!items.length) return []

    // Fetch existing logs for this date
    const { data: existingLogs, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('scheduled_date', dateStr)

    if (error) throw error

    const logMap = new Map<string, MedicationLog>()
    for (const log of existingLogs ?? []) {
      logMap.set(`${log.prescription_item_id}_${log.scheduled_time}`, log)
      // Fallback key if time doesn't match precisely
      if (!logMap.has(log.prescription_item_id)) {
        logMap.set(log.prescription_item_id, log)
      }
    }

    const scheduleItems: DailyScheduleItem[] = []
    const autoMissedToPersist: {
      userId: string
      prescriptionItemId: string
      scheduledDate: string
      scheduledTime: string
    }[] = []

    for (const item of items) {
      if (!item.medicine) continue

      const meals =
        item.meal_types && item.meal_types.length > 0
          ? item.meal_types
          : [item.meal_type]

      for (const meal of meals) {
        const reminderTime = calculateReminderTime(
          meal,
          item.food_relation,
          item.custom_time,
          profile
        )

        const existingLog =
          logMap.get(`${item.id}_${reminderTime}`) || logMap.get(item.id)

        let effectiveStatus: LogStatus = 'pending'
        let logId: string | undefined = undefined
        let takenAt: string | null = null
        let notes: string | null = null

        if (existingLog) {
          logId = existingLog.id
          effectiveStatus = existingLog.status
          takenAt = existingLog.taken_at
          notes = existingLog.notes

          if (
            effectiveStatus === 'pending' &&
            isTimeInPast(dateStr, reminderTime)
          ) {
            effectiveStatus = 'missed'
            autoMissedToPersist.push({
              userId,
              prescriptionItemId: item.id,
              scheduledDate: dateStr,
              scheduledTime: reminderTime,
            })
          }
        } else {
          if (isTimeInPast(dateStr, reminderTime)) {
            effectiveStatus = 'missed'
            autoMissedToPersist.push({
              userId,
              prescriptionItemId: item.id,
              scheduledDate: dateStr,
              scheduledTime: reminderTime,
            })
          }
        }

        scheduleItems.push({
          prescriptionItem: item,
          medicine: {
            id: item.medicine.id,
            medicine_name: item.medicine.medicine_name,
            dosage: item.dosage,
            meal_type: meal,
            food_relation: item.food_relation,
            custom_time: item.custom_time,
          },
          logId,
          scheduledDate: dateStr,
          scheduledTime: reminderTime,
          status: effectiveStatus,
          takenAt,
          notes,
        })
      }
    }

    scheduleItems.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    // Background auto-persist missed doses
    if (autoMissedToPersist.length > 0) {
      void Promise.all(
        autoMissedToPersist.map((item) =>
          supabase
            .from('medication_logs')
            .upsert(
              {
                user_id: item.userId,
                prescription_item_id: item.prescriptionItemId,
                scheduled_date: item.scheduledDate,
                scheduled_time: item.scheduledTime,
                status: 'missed',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'prescription_item_id,scheduled_date' }
            )
        )
      )
    }

    return scheduleItems
  },

  // ── 4. Delete Log ────────────────────────────────────────────
  async deleteLog(logId: string): Promise<void> {
    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('id', logId)

    if (error) throw error
  },
}
