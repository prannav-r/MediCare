// ============================================================
// src/components/prescription/PrescriptionForm.tsx
// Reusable form for creating and editing doctor prescriptions (MVP 3).
// ============================================================

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  createPrescriptionSchema,
  prescriptionSchema,
  type PrescriptionFormData,
} from '@/schemas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getLocalDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface PrescriptionFormProps {
  defaultValues?: Partial<PrescriptionFormData>
  onSubmit: (data: PrescriptionFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
  isCreate?: boolean
}

export function PrescriptionForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save Prescription',
  isCreate = false,
}: PrescriptionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescriptionFormData>({
    resolver: zodResolver(isCreate ? createPrescriptionSchema : prescriptionSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      doctor_name: defaultValues?.doctor_name ?? '',
      start_date: defaultValues?.start_date ?? getLocalDateStr(),
      end_date:
        defaultValues?.end_date ??
        getLocalDateStr(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Prescription Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Hypertension 3-Month Course"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="doctor_name">Doctor Name (Optional)</Label>
        <Input
          id="doctor_name"
          placeholder="e.g. Dr. A. Sharma"
          {...register('doctor_name')}
        />
        {errors.doctor_name && (
          <p className="text-xs text-destructive">
            {errors.doctor_name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date *</Label>
          <Input
            type="date"
            id="start_date"
            min={isCreate ? getLocalDateStr() : undefined}
            {...register('start_date')}
          />
          {errors.start_date && (
            <p className="text-xs text-destructive">
              {errors.start_date.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="end_date">End Date *</Label>
          <Input type="date" id="end_date" {...register('end_date')} />
          {errors.end_date && (
            <p className="text-xs text-destructive">
              {errors.end_date.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
