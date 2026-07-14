// ============================================================
// src/pages/AddPrescription/index.tsx
// Page to create a new doctor prescription.
// ============================================================

import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FilePlus } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useCreatePrescription } from '@/hooks/usePrescriptions'
import type { PrescriptionFormData } from '@/schemas'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrescriptionForm } from '@/components/prescription/PrescriptionForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AddPrescriptionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { mutateAsync: createPrescription, isPending } = useCreatePrescription()

  const handleSubmit = async (formData: PrescriptionFormData) => {
    try {
      const created = await createPrescription({
        userId: user!.id,
        formData,
      })
      toast.success('Prescription created successfully')
      navigate(`/prescriptions/${created.id}`)
    } catch {
      toast.error('Failed to create prescription')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/prescriptions')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Button>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FilePlus className="h-6 w-6 text-primary" />
            Add New Prescription
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter doctor and hospital details for your medical prescription course
          </p>
        </div>

        <Card className="p-6">
          <PrescriptionForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            submitLabel="Create Prescription"
            isCreate={true}
          />
        </Card>
      </div>
    </AppLayout>
  )
}
