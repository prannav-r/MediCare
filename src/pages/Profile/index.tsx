// ============================================================
// src/pages/Profile/index.tsx
// Meal timing configuration page.
// ============================================================

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Clock, Utensils, AlertCircle, Save } from 'lucide-react'
import { toast } from 'sonner'

import { profileSchema, type ProfileFormData } from '@/schemas'
import { useProfile, useUpsertProfile } from '@/hooks/useProfile'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const mealFields = [
  {
    name: 'breakfast_time' as const,
    label: 'Breakfast',
    emoji: '🌅',
    description: 'Morning meal time',
    defaultValue: '08:00',
  },
  {
    name: 'lunch_time' as const,
    label: 'Lunch',
    emoji: '☀️',
    description: 'Afternoon meal time',
    defaultValue: '13:00',
  },
  {
    name: 'dinner_time' as const,
    label: 'Dinner',
    emoji: '🌙',
    description: 'Evening meal time',
    defaultValue: '20:00',
  },
]

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const { mutateAsync: upsertProfile, isPending } = useUpsertProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      breakfast_time: '08:00',
      lunch_time: '13:00',
      dinner_time: '20:00',
    },
  })

  // Pre-populate form when existing profile loads
  useEffect(() => {
    if (profile) {
      reset({
        breakfast_time: profile.breakfast_time,
        lunch_time: profile.lunch_time,
        dinner_time: profile.dinner_time,
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await upsertProfile(data)
      toast.success('Meal timings saved successfully!')
      if (!profile) {
        // First time setup — redirect to medicines list
        navigate('/medicines')
      }
    } catch {
      toast.error('Failed to save meal timings. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <Card>
            <CardContent className="p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Utensils className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Meal Timings</h1>
          </div>
          <p className="text-muted-foreground">
            {profile
              ? 'Update your meal times. Medicine reminders will be calculated based on these.'
              : 'Set your meal times to get started. This helps MediCare calculate the right time for each medicine.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Your Daily Meal Schedule
              </CardTitle>
              <CardDescription>
                Enter times in 24-hour format (e.g., 08:30 for 8:30 AM)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {mealFields.map(({ name, label, emoji, description, defaultValue: _def }) => (
                <div key={name} className="space-y-2">
                  <Label htmlFor={name}>
                    <span className="flex items-center gap-2">
                      <span>{emoji}</span>
                      <span>{label}</span>
                      <span className="text-xs text-muted-foreground font-normal">— {description}</span>
                    </span>
                  </Label>
                  <Input
                    id={name}
                    type="time"
                    {...register(name)}
                    aria-invalid={!!errors[name]}
                    className="w-full"
                  />
                  {errors[name] && (
                    <p className="flex items-center gap-1.5 text-sm text-destructive">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors[name]?.message}
                    </p>
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || (!isDirty && !!profile)}
                id="save-profile-btn"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {profile ? 'Save Changes' : 'Save & Continue'}
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}
