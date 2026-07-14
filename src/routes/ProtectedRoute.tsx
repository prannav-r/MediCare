// ============================================================
// src/routes/ProtectedRoute.tsx
// Guards authenticated routes.
//
// HOW IT WORKS:
//   - If loading: show spinner (we don't know auth state yet)
//   - If user exists: render the child page
//   - If no user: redirect to login
//
// The 'replace' prop on Navigate replaces the history entry
// so pressing Back after redirect doesn't loop back to the
// protected page.
// ============================================================

import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Pill } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // Still checking session — show a loading spinner
  // This prevents a flash of the login page for authenticated users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25 animate-pulse">
            <Pill className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Loading MediCare...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

// ── PublicRoute: redirects logged-in users away from auth pages ──
// If a logged-in user visits /login, redirect them to /dashboard
export function PublicRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary animate-pulse">
          <Pill className="h-8 w-8 text-primary-foreground" />
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
