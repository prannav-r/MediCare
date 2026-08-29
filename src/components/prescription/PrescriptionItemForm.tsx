// ============================================================
// src/components/prescription/PrescriptionItemForm.tsx
// Reusable form for adding/editing a medicine item (MVP 3).
// Features simple Morning/Afternoon/Evening checkboxes and current inventory input.
// ============================================================

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { prescriptionItemSchema, type PrescriptionItemFormData } from '@/schemas'
import type { Medicine } from '@/types'
import { MedicineSearchCombobox } from '@/components/prescription/MedicineSearchCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface PrescriptionItemFormProps {
  defaultValues?: Partial<PrescriptionItemFormData>
  defaultMedicineName?: string
  onSubmit: (data: PrescriptionItemFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function PrescriptionItemForm({
  defaultValues,
  defaultMedicineName,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Prescription Item',
}: PrescriptionItemFormProps) {
  const [selectedMedName, setSelectedMedName] = useState(defaultMedicineName ?? '')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PrescriptionItemFormData>({
    resolver: zodResolver(prescriptionItemSchema) as any,
    defaultValues: {
      medicine_id: defaultValues?.medicine_id ?? '',
      morning: defaultValues?.morning ?? false,
      afternoon: defaultValues?.afternoon ?? false,
      evening: defaultValues?.evening ?? false,
      current_doses: defaultValues?.current_doses ?? 0,
    },
  })

  const watchMedId = watch('medicine_id')
  const watchMorning = watch('morning')
  const watchAfternoon = watch('afternoon')
  const watchEvening = watch('evening')

  const handleSelectMedicine = (med: Medicine) => {
    setValue('medicine_id', med.id, { shouldValidate: true })
    setSelectedMedName(med.medicine_name)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Medicine Search */}
      <div className="space-y-1.5">
        <Label>Medicine from Catalog *</Label>
        <MedicineSearchCombobox
          value={watchMedId}
          onSelectMedicine={handleSelectMedicine}
          selectedMedicineName={selectedMedName}
        />
        {errors.medicine_id && (
          <p className="text-xs text-destructive">{errors.medicine_id.message}</p>
        )}
      </div>

      {/* Timing Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">When should this medicine be taken? *</Label>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/30">
            <Checkbox 
              checked={watchMorning} 
              onCheckedChange={(checked: any) => setValue('morning', checked === true, { shouldValidate: true })} 
            />
            <span className="text-sm font-medium">Morning (07:00)</span>
          </label>
          
          <label className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/30">
            <Checkbox 
              checked={watchAfternoon} 
              onCheckedChange={(checked: any) => setValue('afternoon', checked === true, { shouldValidate: true })} 
            />
            <span className="text-sm font-medium">Afternoon (12:00)</span>
          </label>
          
          <label className="flex items-center space-x-2 border rounded-md p-3 flex-1 cursor-pointer hover:bg-muted/30">
            <Checkbox 
              checked={watchEvening} 
              onCheckedChange={(checked: any) => setValue('evening', checked === true, { shouldValidate: true })} 
            />
            <span className="text-sm font-medium">Evening (19:00)</span>
          </label>
        </div>
        
        {errors.evening && (
          <p className="text-xs text-destructive">{errors.evening.message}</p>
        )}
      </div>

      {/* Inventory */}
      <div className="space-y-1.5 max-w-sm">
        <Label htmlFor="current_doses">Current Inventory (Total available doses) *</Label>
        <Input
          type="number"
          id="current_doses"
          min={0}
          {...register('current_doses', { valueAsNumber: true })}
        />
        {errors.current_doses && (
          <p className="text-xs text-destructive">{errors.current_doses.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the total number of tablets/doses you currently have at home. This persists across all your prescriptions.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
