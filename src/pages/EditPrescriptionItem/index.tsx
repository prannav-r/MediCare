// ============================================================
// src/pages/EditPrescriptionItem/index.tsx
// Page to edit an existing prescription item.
// ============================================================

import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2 } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { usePrescriptionItem, useUpdatePrescriptionItem } from '@/hooks/usePrescriptionItems'
import { usePrescription } from '@/hooks/usePrescriptions'
import { useInventoryItem, useSetInventory } from '@/hooks/useInventory'
import { calculateRequiredDoses } from '@/utils/doseCalculator'
import type { PrescriptionItemFormData } from '@/schemas'

import { AppLayout } from '@/components/layout/AppLayout'
import { PrescriptionItemForm } from '@/components/prescription/PrescriptionItemForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function EditPrescriptionItemPage() {
  const { id: prescriptionId, itemId } = useParams<{ id: string; itemId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: prescription } = usePrescription(prescriptionId)
  const { data: item, isLoading: itemLoading } = usePrescriptionItem(itemId)
  
  // Fetch current inventory for the item's medicine
  const { data: inventoryItem, isLoading: invLoading } = useInventoryItem(user?.id, item?.medicine_id)

  const { mutateAsync: updateItem, isPending: updatingItem } = useUpdatePrescriptionItem()
  const { mutateAsync: setInventory, isPending: settingInventory } = useSetInventory()

  const handleSubmit = async (formData: PrescriptionItemFormData) => {
    if (!prescription) {
      toast.error('Prescription data not loaded')
      return
    }

    try {
      const { totalRequired } = calculateRequiredDoses(
        prescription.start_date,
        prescription.end_date,
        formData.morning,
        formData.afternoon,
        formData.evening,
        formData.quantity_per_dose
      )

      await setInventory({
        userId: user!.id,
        medicineId: formData.medicine_id,
        currentDoses: formData.current_doses,
      })

      await updateItem({
        id: itemId!,
        formData,
        totalRequiredDoses: totalRequired,
      })

      toast.success('Prescription item updated')
      navigate(`/prescriptions/${prescriptionId}`)
    } catch (err: any) {
      console.error('Error updating prescription item:', err)
      toast.error(err?.message || 'Failed to update item')
    }
  }

  const isLoading = itemLoading || invLoading
  const isPending = updatingItem || settingInventory

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/prescriptions/${prescriptionId}`)} className="-ml-2">
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
          <Card className="p-12 text-center text-muted-foreground">Loading medicine item...</Card>
        ) : (
          <Card className="p-6">
            <PrescriptionItemForm
              defaultValues={{
                medicine_id: item.medicine_id,
                morning: item.morning,
                afternoon: item.afternoon,
                evening: item.evening,
                quantity_per_dose: item.quantity_per_dose,
                current_doses: inventoryItem?.current_doses ?? 0,
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
