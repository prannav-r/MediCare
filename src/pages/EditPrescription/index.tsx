// ============================================================
// src/pages/EditPrescription/index.tsx
// Page to edit an existing doctor prescription.
// ============================================================

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit } from 'lucide-react'
import { toast } from 'sonner'

import {
  usePrescription,
  useUpdatePrescription,
} from '@/hooks/usePrescriptions'
import type { PrescriptionFormData } from '@/schemas'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrescriptionForm } from '@/components/prescription/PrescriptionForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function EditPrescriptionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: prescription, isLoading } = usePrescription(id)
  const { mutateAsync: updatePrescription, isPending } = useUpdatePrescription()

  const handleSubmit = async (formData: PrescriptionFormData) => {
    try {
      await updatePrescription({ id: id!, formData })
      toast.success('Prescription updated')
      navigate(`/prescriptions/${id}`)
    } catch {
      toast.error('Failed to update prescription')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/prescriptions/${id}`)}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Details
        </Button>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Edit className="h-6 w-6 text-primary" />
            Edit Prescription
          </h1>
        </div>

        {isLoading || !prescription ? (
          <Card className="p-12 text-center text-muted-foreground">
            Loading prescription...
          </Card>
        ) : (
          <Card className="p-6">
            <PrescriptionForm
              defaultValues={{
                title: prescription.title,
                doctor_name: prescription.doctor_name,
                hospital_name: prescription.hospital_name,
                description: prescription.description ?? undefined,
                start_date: prescription.start_date,
                end_date: prescription.end_date,
                status: prescription.status,
              }}
              onSubmit={handleSubmit}
              isLoading={isPending}
              submitLabel="Save Changes"
            />
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
