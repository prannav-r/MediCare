// ============================================================
// src/components/calendar/DailyMedicationDialog.tsx
// Interactive sheet/dialog showing every scheduled prescription item for a date.
// ============================================================

import { Clock, Pill } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useDailySchedule, useUpsertLog } from '@/hooks/useMedicationLogs'
import type {
  DailyScheduleItem,
  LogStatus,
  PrescriptionItemWithMedicine,
  Profile,
} from '@/types'
import {
  FOOD_RELATION_LABELS,
  LOG_STATUS_LABELS,
} from '@/types'
import { cn, formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DailyMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dateStr: string
  items: PrescriptionItemWithMedicine[]
  profile: Profile | null
}


export function DailyMedicationDialog({
  open,
  onOpenChange,
  dateStr,
  items,
  profile,
}: DailyMedicationDialogProps) {
  const { user } = useAuth()
  const { data: scheduleItems = [], isLoading } = useDailySchedule(
    user?.id,
    dateStr,
    items,
    profile
  )

  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString(
    undefined,
    {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  )

  const morningItems = scheduleItems.filter(
    (item) => item.medicine.meal_type === 'breakfast'
  )
  const afternoonItems = scheduleItems.filter(
    (item) => item.medicine.meal_type === 'lunch'
  )
  const nightItems = scheduleItems.filter(
    (item) => item.medicine.meal_type === 'dinner'
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pill className="h-5 w-5 text-primary" />
            Daily Medications ({scheduleItems.length} total tablets)
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-foreground/80">
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading schedule...
          </div>
        ) : scheduleItems.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No medicine items scheduled for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <TimingSectionColumn
              title="🌅 Morning (Day)"
              subtitle="Breakfast timing"
              items={morningItems}
              userId={user!.id}
              dateStr={dateStr}
              badgeClassName="bg-amber-500/15 text-amber-700 dark:text-amber-300"
            />
            <TimingSectionColumn
              title="☀️ Afternoon"
              subtitle="Lunch timing"
              items={afternoonItems}
              userId={user!.id}
              dateStr={dateStr}
              badgeClassName="bg-blue-500/15 text-blue-700 dark:text-blue-300"
            />
            <TimingSectionColumn
              title="🌙 Night"
              subtitle="Dinner timing"
              items={nightItems}
              userId={user!.id}
              dateStr={dateStr}
              badgeClassName="bg-purple-500/15 text-purple-700 dark:text-purple-300"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TimingSectionColumn({
  title,
  subtitle,
  items,
  userId,
  dateStr,
  badgeClassName,
}: {
  title: string
  subtitle: string
  items: DailyScheduleItem[]
  userId: string
  dateStr: string
  badgeClassName: string
}) {
  const foodOrder: Record<string, number> = {
    before_food: 1,
    with_food: 2,
    after_food: 3,
    anytime: 4,
  }

  const groupedByFood = Array.from(
    items.reduce((map, item) => {
      const rel = item.medicine.food_relation
      if (!map.has(rel)) map.set(rel, [])
      map.get(rel)!.push(item)
      return map
    }, new Map<string, DailyScheduleItem[]>())
  ).sort(([a], [b]) => (foodOrder[a] || 99) - (foodOrder[b] || 99))

  return (
    <div className="flex flex-col space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        <span
          className={cn(
            'text-xs px-2.5 py-0.5 rounded-full font-semibold',
            badgeClassName
          )}
        >
          {items.length} {items.length === 1 ? 'Tablet' : 'Tablets'}
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-card/50 rounded-lg border border-dashed border-border">
            No tablets scheduled
          </div>
        ) : (
          groupedByFood.map(([relation, subItems]) => (
            <FoodGroupSection
              key={relation}
              relation={relation}
              items={subItems}
              userId={userId}
              dateStr={dateStr}
            />
          ))
        )}
      </div>
    </div>
  )
}

function FoodGroupSection({
  relation,
  items,
  userId,
  dateStr,
}: {
  relation: string
  items: DailyScheduleItem[]
  userId: string
  dateStr: string
}) {
  const { mutateAsync: upsertLog, isPending } = useUpsertLog()
  const allTaken = items.every((i) => i.status === 'taken')

  const handleToggleGroup = async () => {
    const targetStatus: LogStatus = allTaken ? 'pending' : 'taken'
    try {
      await Promise.all(
        items.map((item) =>
          upsertLog({
            userId,
            prescriptionItemId: item.prescriptionItem.id,
            scheduledDate: dateStr,
            scheduledTime: item.scheduledTime,
            status: targetStatus,
            notes: item.notes,
          })
        )
      )
      toast.success(
        `Marked ${items.length} tablet(s) as ${LOG_STATUS_LABELS[targetStatus]}`
      )
    } catch (err: any) {
      console.error('Error toggling food group status:', err)
      toast.error(err?.message || 'Failed to update status')
    }
  }

  return (
    <div className="rounded-lg border border-border/80 bg-card/60 p-2.5 space-y-2.5">
      <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
        <span className="text-xs font-semibold text-primary">
          {FOOD_RELATION_LABELS[relation as keyof typeof FOOD_RELATION_LABELS] ||
            relation}
        </span>
        <Button
          size="sm"
          variant={allTaken ? 'outline' : 'default'}
          disabled={isPending}
          onClick={handleToggleGroup}
          className={cn(
            'h-6 px-2.5 text-[11px]',
            allTaken
              ? 'hover:border-emerald-500 hover:text-emerald-600'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          )}
        >
          {allTaken ? '✓ Taken (All)' : 'Mark Group Taken'}
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <ScheduleItemCard
            key={`${item.prescriptionItem.id}_${item.scheduledTime}`}
            item={item}
            userId={userId}
            dateStr={dateStr}
          />
        ))}
      </div>
    </div>
  )
}

function ScheduleItemCard({
  item,
}: {
  item: DailyScheduleItem
  userId: string
  dateStr: string
}) {
  return (
    <div className="p-2.5 rounded-md border border-border/50 bg-card/40 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-xs sm:text-sm">
          {item.medicine.medicine_name}
        </h4>
        <span className="text-[11px] text-muted-foreground">
          ({item.medicine.dosage})
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <span>{formatTime(item.scheduledTime)}</span>
      </div>
    </div>
  )
}
