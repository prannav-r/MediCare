// ============================================================
// src/contexts/AuthContext/index.tsx
// Global authentication state using React Context.
//
// WHY React Context (not Redux/Zustand)?
// Auth state is a classic use case for Context because:
//   - It's global (all pages need to know if user is logged in)
//   - It changes rarely (login/logout/session expiry)
//   - It doesn't need complex derived state or actions
//
// ARCHITECTURE PATTERN:
//   AuthProvider wraps the entire app tree.
//   useAuth() hook is the ONLY way components access auth state.
//   This pattern is idiomatic React and maps 1:1 to React Native.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/authService'
import type { AuthUser } from '@/types'

// ─── Context Shape ────────────────────────────────────────────
interface AuthContextType {
  user: AuthUser | null           // null = not logged in
  loading: boolean                 // true while checking session on startup
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

// ─── Create Context ───────────────────────────────────────────
// We initialize with undefined and assert in useAuth()
// This prevents using the context outside its provider.
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ─── Provider Component ───────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true) // start true: we don't know yet

  useEffect(() => {
    // ── Step 1: Check existing session on mount ──────────────
    // This runs ONCE when the app loads.
    // It reads the stored JWT from localStorage and validates it.
    authService.getSession().then((session) => {
      if (session?.user) {
        setUser(authService.mapUser(session.user))
      }
      // ALWAYS set loading to false after checking,
      // even if there's no session — otherwise the app hangs
      setLoading(false)
    })

    // ── Step 2: Subscribe to auth state changes ───────────────
    // onAuthStateChange fires on:
    //   - SIGNED_IN (login, register, session restored)
    //   - SIGNED_OUT (logout, token expired)
    //   - TOKEN_REFRESHED (background token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(authService.mapUser(session.user))
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    // ── Cleanup: unsubscribe on component unmount ─────────────
    // Without this, the subscription would keep firing even after
    // the component is removed from the DOM (memory leak).
    return () => subscription.unsubscribe()
  }, []) // empty deps = run only once on mount

  // ─── Auth Actions ─────────────────────────────────────────
  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password)
    if (data.user) {
      setUser(authService.mapUser(data.user))
    }
  }

  const register = async (email: string, password: string) => {
    await authService.register(email, password)
    // Note: Supabase may require email confirmation.
    // After registration, user state is set by onAuthStateChange.
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Custom Hook ─────────────────────────────────────────────
// This is the ONLY way components should access auth state.
// Throwing here gives a clear error message when context is
// used outside the provider (a common mistake).
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
