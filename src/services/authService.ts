// ============================================================
// src/services/authService.ts
// All Supabase Auth operations live here.
//
// WHY a service layer?
// Components should NOT call supabase directly. Instead:
//   Component → Custom Hook → Service → Supabase
// Benefits:
//   - Easy to swap Supabase for another backend later
//   - Single place to add error handling, logging, retry logic
//   - React Native reuse — same service, different UI
// ============================================================

import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'

export const authService = {
  // ── Register ────────────────────────────────────────────────
  async register(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // ── Login ───────────────────────────────────────────────────
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // ── Logout ──────────────────────────────────────────────────
  async logout() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // ── Get Current Session ─────────────────────────────────────
  // Used on app startup to restore session from localStorage
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  // ── Map Supabase User to our AuthUser type ──────────────────
  // Abstraction layer: our app doesn't depend on Supabase's User shape
  mapUser(supabaseUser: { id: string; email?: string }): AuthUser {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
    }
  },
}
