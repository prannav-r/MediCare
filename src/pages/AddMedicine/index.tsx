// ============================================================
// src/pages/AddMedicine/index.tsx
// Legacy route bridge redirecting to /prescriptions/new.
// ============================================================

import { Navigate } from 'react-router-dom'

export function AddMedicinePage() {
  return <Navigate to="/prescriptions/new" replace />
}
