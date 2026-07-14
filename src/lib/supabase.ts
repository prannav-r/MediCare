// ============================================================
// src/lib/supabase.ts
// Supabase client initialization.
// ============================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseUrl.startsWith('https://')

if (!isConfigured && import.meta.env.DEV) {
  console.warn(
    '[MediCare] Supabase not configured. ' +
    'Open .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ' +
    'Get them from: Supabase Dashboard → Project Settings → API'
  )
}

// Use real values if configured, otherwise use valid-format placeholders
// that won't throw but will fail at runtime (showing auth errors to user)
export const supabase = createClient<Database>(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export const isSupabaseConfigured = isConfigured
