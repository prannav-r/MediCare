// ============================================================
// src/pages/Dashboard/index.tsx
// Refactored Dashboard Page for the Prescription Domain Model.
//
// WHY THIS PAGE?
// Central command center displaying Active Prescriptions, Today's
// medication schedule checklist, Low stock warnings, and quick links.
// ============================================================

import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  PlusCircle,
  Pill,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import {
  useDailySchedule,
  useUpsertLog,
} from '@/hooks/useMedicationLogs'
import { useAllActivePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { usePrescriptions } from '@/hooks/usePrescriptions'
import { useProfile } from '@/hooks/useProfile'
import type { FoodRelation, LogStatus, MealType } from '@/types'
import {
  FOOD_RELATION_LABELS,
  LOG_STATUS_LABELS,
  MEAL_TYPE_LABELS,
} from '@/types'
import { cn, formatTime } from '@/lib/utils'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const MEAL_EMOJIS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: prescriptions = [], isLoading: prescLoading } = usePrescriptions(
    user?.id
  )
  const { data: activeItems = [], isLoading: itemsLoading } =
    useAllActivePrescriptionItems(user?.id)
  const { data: profile, isLoading: profLoading } = useProfile()

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const { data: todaySchedule = [], isLoading: schedLoading } =
    useDailySchedule(user?.id, todayStr, activeItems, profile)

  const { mutateAsync: upsertLog, isPending: isUpdatingLog } = useUpsertLog()

  const activePrescriptions = useMemo(
    () => prescriptions.filter((p) => p.status === 'active'),
    [prescriptions]
  )

  const lowStockItems = useMemo(
    () => activeItems.filter((item) => item.remaining_stock <= 5),
    [activeItems]
  )


  const mealOrder: Record<string, number> = {
    breakfast: 1,
    lunch: 2,
    dinner: 3,
  }

  const foodOrder: Record<string, number> = {
    before_food: 1,
    with_food: 2,
    after_food: 3,
    anytime: 4,
  }

  const groupedSchedule = useMemo(() => {
    const map = new Map<string, typeof todaySchedule>()

    for (const item of todaySchedule) {
      const meal = item.medicine.meal_type
      const relation = item.medicine.food_relation
      const key = `${meal}__${relation}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(item)
    }

    const groups = Array.from(map.entries()).map(([key, items]) => {
      const [meal, relation] = key.split('__')
      return {
        key,
        meal: meal as MealType,
        relation: relation as FoodRelation,
        items,
      }
    })

    return groups.sort((a, b) => {
      const mDiff = (mealOrder[a.meal] || 99) - (mealOrder[b.meal] || 99)
      if (mDiff !== 0) return mDiff
      return (foodOrder[a.relation] || 99) - (foodOrder[b.relation] || 99)
    })
  }, [todaySchedule])

  const handleToggleGroup = async (
    groupItems: typeof todaySchedule,
    targetStatus: LogStatus,
    groupLabel: string
  ) => {
    try {
      await Promise.all(
        groupItems.map((item) =>
          upsertLog({
            userId: user!.id,
            prescriptionItemId: item.prescriptionItem.id,
            scheduledDate: todayStr,
            scheduledTime: item.scheduledTime,
            status: targetStatus,
            notes: item.notes,
          })
        )
      )
      toast.success(
        `Marked ${groupItems.length} medicine(s) as ${LOG_STATUS_LABELS[targetStatus]} for ${groupLabel}`
      )
    } catch (err: any) {
      console.error('Error toggling group status:', err)
      toast.error(err?.message || 'Failed to update dose status')
    }
  }

  const isLoading =
    prescLoading || itemsLoading || profLoading || schedLoading

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.email?.split('@')[0]} 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here is your daily medical prescription schedule for today
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/prescriptions/new">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Prescription
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Prescriptions
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {activePrescriptions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Out of {prescriptions.length} total courses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Medicine Items
                </CardTitle>
                <Pill className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeItems.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Scheduled daily doses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Checklist
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {todaySchedule.filter((i) => i.status === 'taken').length}/
                  {todaySchedule.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Doses marked taken today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Low Stock Alert
                </CardTitle>
                <AlertTriangle
                  className={
                    lowStockItems.length > 0
                      ? 'h-4 w-4 text-destructive'
                      : 'h-4 w-4 text-muted-foreground'
                  }
                />
              </CardHeader>
              <CardContent>
                <div
                  className={
                    lowStockItems.length > 0
                      ? 'text-3xl font-bold text-destructive'
                      : 'text-3xl font-bold'
                  }
                >
                  {lowStockItems.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockItems.length > 0
                    ? 'Medicines need refill'
                    : 'All stocks healthy'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Low Stock Banner */}
        {lowStockItems.length > 0 && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <h4 className="font-semibold text-sm text-destructive">
                  Refill Needed ({lowStockItems.length} items running low)
                </h4>
                <p className="text-xs text-muted-foreground">
                  {lowStockItems
                    .map(
                      (item) =>
                        `${item.medicine?.medicine_name} (${item.remaining_stock} left)`
                    )
                    .join(', ')}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/prescriptions')}
            >
              Refill Prescriptions
            </Button>
          </Card>
        )}

        {/* Today's Medication Schedule Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today&apos;s Scheduled Medications</span>
              <span className="text-xs font-normal text-muted-foreground">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
                <h4 className="font-semibold text-base">
                  No medicines scheduled for today
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add a prescription with medicine items to generate your daily reminder checklist.
                </p>
                <Link to="/prescriptions/new">
                  <Button size="sm">Create Prescription</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedSchedule.map((group) => {
                  const allTaken = group.items.every((i) => i.status === 'taken')
                  const groupLabel = `${MEAL_TYPE_LABELS[group.meal]} (${FOOD_RELATION_LABELS[group.relation]})`

                  return (
                    <div
                      key={group.key}
                      className="rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-all hover:border-primary/30"
                    >
                      {/* Group Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/40 border-b border-border/80">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{MEAL_EMOJIS[group.meal]}</span>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base flex items-center gap-2">
                              {MEAL_TYPE_LABELS[group.meal]}
                              <span className="text-muted-foreground">·</span>
                              <span className="text-primary font-semibold">
                                {FOOD_RELATION_LABELS[group.relation]}
                              </span>
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {group.items.length} medicine{group.items.length > 1 ? 's' : ''} in this group
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={allTaken ? 'success' : 'secondary'}
                            className="text-xs font-medium"
                          >
                            {allTaken ? '✓ Taken' : 'Pending'}
                          </Badge>

                          <Button
                            size="sm"
                            variant={allTaken ? 'outline' : 'default'}
                            disabled={isUpdatingLog}
                            onClick={() =>
                              handleToggleGroup(
                                group.items,
                                allTaken ? 'pending' : 'taken',
                                groupLabel
                              )
                            }
                            className={cn(
                              'shadow-xs',
                              allTaken
                                ? 'hover:border-emerald-500 hover:text-emerald-600'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            {allTaken ? 'Unmark Group' : 'Mark Group Taken'}
                          </Button>
                        </div>
                      </div>

                      {/* List of Medicines inside the Group */}
                      <div className="divide-y divide-border/60">
                        {group.items.map((item) => (
                          <div
                            key={`${item.prescriptionItem.id}_${item.scheduledTime}`}
                            className="p-3 sm:px-4 flex items-center justify-between gap-4"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-sm">
                                  {item.medicine.medicine_name}
                                </h5>
                                <span className="text-xs text-muted-foreground">
                                  ({item.medicine.dosage})
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 text-primary" />
                                <span>{formatTime(item.scheduledTime)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
