// ============================================================
// src/pages/EditMedicine/index.tsx
// Legacy route bridge redirecting to /prescriptions.
// ============================================================

import { Navigate } from 'react-router-dom'

export function EditMedicinePage() {
  return <Navigate to="/prescriptions" replace />
}
