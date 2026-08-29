// ============================================================
// src/App.tsx
// Root component — providers + routing for MediCare (MVP 3)
// ============================================================

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'

import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from '@/routes/ProtectedRoute'

// Auth & Shell Pages
import { LoginPage } from '@/pages/Login'
import { RegisterPage } from '@/pages/Register'
import { DashboardPage } from '@/pages/Dashboard'
import { CalendarPage } from '@/pages/Calendar'

// Prescription Domain Pages
import { PrescriptionsPage } from '@/pages/Prescriptions'
import { AddPrescriptionPage } from '@/pages/AddPrescription'
import { EditPrescriptionPage } from '@/pages/EditPrescription'
import { PrescriptionDetailsPage } from '@/pages/PrescriptionDetails'
import { AddPrescriptionItemPage } from '@/pages/AddPrescriptionItem'
import { EditPrescriptionItemPage } from '@/pages/EditPrescriptionItem'

// Inventory Page
import { InventoryPage } from '@/pages/Inventory'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('PGRST')) {
          return false
        }
        return failureCount < 2
      },
      staleTime: 30 * 1000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ── Public Routes ── */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* ── Protected Routes ── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryPage />
                </ProtectedRoute>
              }
            />
            {/* ── Prescription Domain Routes ── */}
            <Route
              path="/prescriptions"
              element={
                <ProtectedRoute>
                  <PrescriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions/new"
              element={
                <ProtectedRoute>
                  <AddPrescriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions/:id"
              element={
                <ProtectedRoute>
                  <PrescriptionDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions/:id/edit"
              element={
                <ProtectedRoute>
                  <EditPrescriptionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions/:id/items/new"
              element={
                <ProtectedRoute>
                  <AddPrescriptionItemPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prescriptions/:id/items/:itemId/edit"
              element={
                <ProtectedRoute>
                  <EditPrescriptionItemPage />
                </ProtectedRoute>
              }
            />

            {/* ── 404 Fallback ── */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
                    <p className="text-muted-foreground mt-2">Page not found</p>
                    <a href="/" className="text-primary hover:underline mt-4 block">
                      Go home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>

          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
