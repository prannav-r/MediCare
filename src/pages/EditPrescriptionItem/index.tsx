// ============================================================
// src/pages/EditPrescriptionItem/index.tsx
// Page to edit an existing prescription item.
// ============================================================

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  usePrescriptionItem,
  useUpdatePrescriptionItem,
} from '@/hooks/usePrescriptionItems'
import type { PrescriptionItemFormData } from '@/schemas'
import { AppLayout } from '@/components/layout/AppLayout'
import { PrescriptionItemForm } from '@/components/prescription/PrescriptionItemForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function EditPrescriptionItemPage() {
  const { id: prescriptionId, itemId } = useParams<{
    id: string
    itemId: string
  }>()
  const navigate = useNavigate()

  const { data: item, isLoading } = usePrescriptionItem(itemId)
  const { mutateAsync: updateItem, isPending } = useUpdatePrescriptionItem()

  const handleSubmit = async (formData: PrescriptionItemFormData) => {
    try {
      await updateItem({
        id: itemId!,
        formData,
      })
      toast.success('Prescription item updated')
      navigate(`/prescriptions/${prescriptionId}`)
    } catch (err: any) {
      console.error('Error updating prescription item:', err)
      toast.error(err?.message || 'Failed to update item')
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
            <Edit2 className="h-6 w-6 text-primary" />
            Edit Prescribed Medicine
          </h1>
        </div>

        {isLoading || !item ? (
          <Card className="p-12 text-center text-muted-foreground">
            Loading medicine item...
          </Card>
        ) : (
          <Card className="p-6">
            <PrescriptionItemForm
              defaultValues={{
                medicine_id: item.medicine_id,
                dosage: item.dosage,
                meal_type: item.meal_type,
                food_relation: item.food_relation,
                custom_time: item.custom_time ?? undefined,
                daily_frequency: item.daily_frequency,
                quantity_per_dose: item.quantity_per_dose,
                remaining_stock: item.remaining_stock,
                notes: item.notes ?? undefined,
              }}
              defaultMedicineName={item.medicine?.medicine_name}
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
