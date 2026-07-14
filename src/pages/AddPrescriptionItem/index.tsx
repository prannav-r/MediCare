// ============================================================
// src/pages/AddPrescriptionItem/index.tsx
// Page to search and add a medicine item to a prescription.
// ============================================================

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pill } from 'lucide-react'
import { toast } from 'sonner'

import { useCreatePrescriptionItem } from '@/hooks/usePrescriptionItems'
import { usePrescription } from '@/hooks/usePrescriptions'
import type { PrescriptionItemFormData } from '@/schemas'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrescriptionItemForm } from '@/components/prescription/PrescriptionItemForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function AddPrescriptionItemPage() {
  const { id: prescriptionId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: prescription } = usePrescription(prescriptionId)
  const { mutateAsync: createItem, isPending } = useCreatePrescriptionItem()

  const handleSubmit = async (formData: PrescriptionItemFormData) => {
    try {
      await createItem({
        prescriptionId: prescriptionId!,
        formData,
      })
      toast.success('Medicine item added to prescription')
      navigate(`/prescriptions/${prescriptionId}`)
    } catch (err: any) {
      console.error('Error adding prescription item:', err)
      toast.error(err?.message || 'Failed to add medicine item')
    }
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/prescriptions/${prescriptionId}`)}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescription
        </Button>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            Add Prescribed Medicine
          </h1>
          {prescription && (
            <p className="text-sm text-muted-foreground mt-1">
              Adding to &quot;{prescription.title}&quot; by {prescription.doctor_name}
            </p>
          )}
        </div>

        <Card className="p-6">
          <PrescriptionItemForm
            onSubmit={handleSubmit}
            isLoading={isPending}
            submitLabel="Add to Prescription"
          />
        </Card>
      </div>
    </AppLayout>
  )
}
