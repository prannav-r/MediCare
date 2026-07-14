// ============================================================
// src/services/profileService.ts
// Profile CRUD operations (meal timings).
// ============================================================

import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'
import type { ProfileFormData } from '@/schemas'

export const profileService = {
  // ── Get Profile by User ID ──────────────────────────────────
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      // RLS ensures users can only read their own row,
      // but we also filter by user_id as a defensive measure
      .eq('user_id', userId)
      .single() // returns one row or null (not an array)

    if (error) {
      // PGRST116 = "no rows found" — this is expected for new users
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  },

  // ── Create Profile (called after first login/register) ─────
  async createProfile(userId: string, formData: ProfileFormData): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        breakfast_time: formData.breakfast_time,
        lunch_time: formData.lunch_time,
        dinner_time: formData.dinner_time,
      })
      .select()   // return the inserted row
      .single()

    if (error) throw error
    return data
  },

  // ── Upsert Profile (create or update) ──────────────────────
  // Using upsert so we don't need to check if profile exists first.
  // onConflict: 'user_id' means "if user_id exists, update it"
  async upsertProfile(userId: string, formData: ProfileFormData): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: userId,
          breakfast_time: formData.breakfast_time,
          lunch_time: formData.lunch_time,
          dinner_time: formData.dinner_time,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },
}
