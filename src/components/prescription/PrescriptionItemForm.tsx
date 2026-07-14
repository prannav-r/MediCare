// ============================================================
// src/components/prescription/PrescriptionItemForm.tsx
// Reusable form for adding/editing a medicine item inside a prescription.
// Features multi-select Morning/Afternoon/Night timings that auto-calculate Daily Frequency.
// ============================================================

import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, Sparkles } from 'lucide-react'
import {
  prescriptionItemSchema,
  type PrescriptionItemFormData,
} from '@/schemas'
import type { MealType, MedicineCatalogItem } from '@/types'
import { MedicineSearchCombobox } from '@/components/prescription/MedicineSearchCombobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface PrescriptionItemFormProps {
  defaultValues?: Partial<PrescriptionItemFormData>
  defaultMedicineName?: string
  onSubmit: (data: PrescriptionItemFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

const MEAL_OPTIONS: { id: MealType; label: string; sub: string; emoji: string }[] = [
  { id: 'breakfast', label: 'Morning', sub: 'Breakfast time', emoji: '🌅' },
  { id: 'lunch', label: 'Afternoon', sub: 'Lunch time', emoji: '☀️' },
  { id: 'dinner', label: 'Night', sub: 'Dinner time', emoji: '🌙' },
]

export function PrescriptionItemForm({
  defaultValues,
  defaultMedicineName,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Prescription Item',
}: PrescriptionItemFormProps) {
  const [selectedMedName, setSelectedMedName] = useState(
    defaultMedicineName ?? ''
  )

  const initialMealTypes: MealType[] =
    defaultValues?.meal_types && defaultValues.meal_types.length > 0
      ? defaultValues.meal_types
      : defaultValues?.meal_type
      ? [defaultValues.meal_type]
      : ['breakfast']

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PrescriptionItemFormData>({
    resolver: zodResolver(prescriptionItemSchema),
    defaultValues: {
      medicine_id: defaultValues?.medicine_id ?? '',
      dosage: defaultValues?.dosage ?? '1 Tablet',
      meal_type: defaultValues?.meal_type ?? initialMealTypes[0] ?? 'breakfast',
      meal_types: initialMealTypes,
      food_relation: defaultValues?.food_relation ?? 'after_food',
      custom_time: defaultValues?.custom_time ?? '',
      daily_frequency:
        defaultValues?.daily_frequency ?? initialMealTypes.length,
      quantity_per_dose: defaultValues?.quantity_per_dose ?? 1,
      remaining_stock: defaultValues?.remaining_stock ?? 30,
      notes: defaultValues?.notes ?? '',
    },
  })

  const watchFoodRelation = watch('food_relation')
  const watchMedId = watch('medicine_id')
  const watchMealTypes = watch('meal_types') ?? initialMealTypes
  const watchDailyFrequency = watch('daily_frequency')

  const handleSelectMedicine = (med: MedicineCatalogItem) => {
    setValue('medicine_id', med.id, { shouldValidate: true })
    setSelectedMedName(med.medicine_name)
  }

  const handleToggleMeal = (mealId: MealType) => {
    const current = watchMealTypes || []
    let updated: MealType[]
    if (current.includes(mealId)) {
      // Don't allow deselecting the very last item
      if (current.length === 1) return
      updated = current.filter((m) => m !== mealId)
    } else {
      // Order correctly: breakfast -> lunch -> dinner
      const order: MealType[] = ['breakfast', 'lunch', 'dinner']
      updated = order.filter((m) => current.includes(m) || m === mealId)
    }

    setValue('meal_types', updated, { shouldValidate: true })
    setValue('meal_type', updated[0] ?? 'breakfast', { shouldValidate: true })
    // Automatically set daily frequency based on selected timings
    setValue('daily_frequency', updated.length, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Search Combobox via Provider Pattern */}
      <div className="space-y-1.5">
        <Label>Medicine from Catalog *</Label>
        <MedicineSearchCombobox
          value={watchMedId}
          onSelectMedicine={handleSelectMedicine}
          selectedMedicineName={selectedMedName}
        />
        {errors.medicine_id && (
          <p className="text-xs text-destructive">
            {errors.medicine_id.message}
          </p>
        )}
      </div>

      {/* Interactive Timing Selection (Morning / Afternoon / Night) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">
            When do you take this medicine? *
          </Label>
          <span className="text-xs text-primary flex items-center gap-1 font-medium">
            <Sparkles className="h-3 w-3" />
            Auto-calculates daily frequency
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {MEAL_OPTIONS.map((opt) => {
            const isSelected = watchMealTypes.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleToggleMeal(opt.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all select-none text-center',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-card hover:border-primary/40 opacity-70 hover:opacity-100'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                )}
                <span className="text-2xl mb-1">{opt.emoji}</span>
                <span className="font-bold text-sm text-foreground">
                  {opt.label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {opt.sub}
                </span>
              </button>
            )
          })}
        </div>
        {errors.meal_types && (
          <p className="text-xs text-destructive">
            {errors.meal_types.message}
          </p>
        )}
      </div>

      {/* Dosage & Remaining Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="dosage">Dosage Instructions *</Label>
          <Input
            id="dosage"
            placeholder="e.g. 1 Tablet / 10 ml"
            {...register('dosage')}
          />
          {errors.dosage && (
            <p className="text-xs text-destructive">{errors.dosage.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="remaining_stock">Initial / Remaining Stock *</Label>
          <Input
            type="number"
            id="remaining_stock"
            {...register('remaining_stock', { valueAsNumber: true })}
          />
          {errors.remaining_stock && (
            <p className="text-xs text-destructive">
              {errors.remaining_stock.message}
            </p>
          )}
        </div>
      </div>

      {/* Timing Relative to Food */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="food_relation">Timing Relative to Food *</Label>
          <Controller
            name="food_relation"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="food_relation"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="after_food">After Food (+30 min)</option>
                <option value="before_food">Before Food (-30 min)</option>
                <option value="with_food">With Food (Exact time)</option>
                <option value="anytime">Anytime (Custom time)</option>
              </select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="daily_frequency">
              Daily Frequency (x times/day) *
            </Label>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Auto-filled ({watchDailyFrequency}x/day)
            </span>
          </div>
          <Input
            type="number"
            id="daily_frequency"
            {...register('daily_frequency', { valueAsNumber: true })}
            className="font-semibold bg-muted/40"
          />
          {errors.daily_frequency && (
            <p className="text-xs text-destructive">
              {errors.daily_frequency.message}
            </p>
          )}
        </div>
      </div>

      {watchFoodRelation === 'anytime' && (
        <div className="space-y-1.5">
          <Label htmlFor="custom_time">Custom Reminder Time (HH:MM) *</Label>
          <Input type="time" id="custom_time" {...register('custom_time')} />
          {errors.custom_time && (
            <p className="text-xs text-destructive">
              {errors.custom_time.message}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="quantity_per_dose">Quantity Per Dose *</Label>
          <Input
            type="number"
            id="quantity_per_dose"
            {...register('quantity_per_dose', { valueAsNumber: true })}
          />
          {errors.quantity_per_dose && (
            <p className="text-xs text-destructive">
              {errors.quantity_per_dose.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Optional Notes</Label>
          <Input
            id="notes"
            placeholder="e.g. Take with warm water"
            {...register('notes')}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
