// ============================================================
// src/pages/Medicines/index.tsx
// Legacy route bridge redirecting to the Prescription Domain Model (/prescriptions).
// ============================================================

import { Navigate } from 'react-router-dom'

export function MedicinesPage() {
  return <Navigate to="/prescriptions" replace />
}
