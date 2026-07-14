// ============================================================
// src/components/medicine/MedicineForm.tsx
// Reusable form used by both AddMedicine and EditMedicine pages.
// This is a great example of component reuse — same UI, different
// behavior based on whether we're creating or editing.
// ============================================================

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'

import { medicineSchema, type MedicineFormData } from '@/schemas'
import type { Medicine } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MedicineFormProps {
  defaultValues?: Partial<MedicineFormData>
  onSubmit: (data: MedicineFormData) => Promise<void>
  isSubmitting: boolean
  submitLabel: string
  medicine?: Medicine  // when editing, the full medicine object
}

export function MedicineForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel,
  medicine: _medicine,
}: MedicineFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      medicine_name: '',
      dosage: '',
      meal_type: undefined,
      food_relation: undefined,
      custom_time: '',
      stock: 0,
      ...defaultValues,
    },
  })

  // Watch food_relation to conditionally show custom_time field
  const foodRelation = watch('food_relation')

  // When editing: pre-populate form with existing medicine data
  useEffect(() => {
    if (defaultValues) {
      reset({ ...defaultValues })
    }
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* ── Medicine Name ──────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="medicine_name">Medicine Name *</Label>
        <Input
          id="medicine_name"
          placeholder="e.g., Metformin, Aspirin, Vitamin D"
          {...register('medicine_name')}
          aria-invalid={!!errors.medicine_name}
        />
        {errors.medicine_name && (
          <ErrorMessage message={errors.medicine_name.message} />
        )}
      </div>

      {/* ── Dosage ────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="dosage">Dosage *</Label>
        <Input
          id="dosage"
          placeholder="e.g., 500mg, 1 tablet, 10ml"
          {...register('dosage')}
          aria-invalid={!!errors.dosage}
        />
        {errors.dosage && (
          <ErrorMessage message={errors.dosage.message} />
        )}
      </div>

      {/* ── Meal + Food Relation ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Meal */}
        <div className="space-y-2">
          <Label>Meal *</Label>
          {/* Controller is needed for Radix UI controlled components
              that don't use native HTML inputs */}
          <Controller
            name="meal_type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="meal_type" aria-invalid={!!errors.meal_type}>
                  <SelectValue placeholder="Select meal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                  <SelectItem value="lunch">☀️ Lunch</SelectItem>
                  <SelectItem value="dinner">🌙 Dinner</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.meal_type && (
            <ErrorMessage message={errors.meal_type.message} />
          )}
        </div>

        {/* Food Relation */}
        <div className="space-y-2">
          <Label>When to take *</Label>
          <Controller
            name="food_relation"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="food_relation" aria-invalid={!!errors.food_relation}>
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_food">Before Food</SelectItem>
                  <SelectItem value="after_food">After Food</SelectItem>
                  <SelectItem value="with_food">With Food</SelectItem>
                  <SelectItem value="anytime">Anytime</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.food_relation && (
            <ErrorMessage message={errors.food_relation.message} />
          )}
        </div>
      </div>

      {/* ── Custom Time (conditional) ─────────────────────── */}
      {foodRelation === 'anytime' && (
        <div className="space-y-2 p-4 rounded-lg border border-dashed border-primary/50 bg-primary/5">
          <Label htmlFor="custom_time">
            Custom Reminder Time *
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (Required for "Anytime" medicines)
            </span>
          </Label>
          <Input
            id="custom_time"
            type="time"
            {...register('custom_time')}
            aria-invalid={!!errors.custom_time}
          />
          {errors.custom_time && (
            <ErrorMessage message={errors.custom_time.message} />
          )}
          <p className="text-xs text-muted-foreground">
            💡 This time will be stored for future reminder scheduling.
          </p>
        </div>
      )}

      {/* ── Stock ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="stock">Current Stock *</Label>
        <Input
          id="stock"
          type="number"
          min="0"
          placeholder="Number of tablets/doses remaining"
          {...register('stock', { valueAsNumber: true })}
          aria-invalid={!!errors.stock}
        />
        <p className="text-xs text-muted-foreground">
          💡 Medicines with 5 or fewer units will be flagged as "Low Stock" on the dashboard.
        </p>
        {errors.stock && (
          <ErrorMessage message={errors.stock.message} />
        )}
      </div>

      {/* ── Submit ────────────────────────────────────────── */}
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
        id="medicine-submit-btn"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </span>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}

// ── Error Message Helper ──────────────────────────────────────
function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  )
}
