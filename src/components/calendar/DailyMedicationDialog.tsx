// ============================================================
// src/components/calendar/DailyMedicationDialog.tsx
// Interactive sheet/dialog showing every scheduled prescription item for a date.
// ============================================================

import { Clock, Pill, Check } from 'lucide-react'
import type { PrescriptionItemWithMedicine } from '@/types'
import { FIXED_SCHEDULE } from '@/types'
import { formatTime } from '@/lib/utils'
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
}

export function DailyMedicationDialog({
  open,
  onOpenChange,
  dateStr,
  items,
}: DailyMedicationDialogProps) {
  
  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString(
    undefined,
    { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }
  )

  // Filter items active on this specific date
  const activeItemsForDate = items.filter(item => {
    if (!item.prescription) return false
    return dateStr >= item.prescription.start_date && dateStr <= item.prescription.end_date
  })

  const morningItems = activeItemsForDate.filter(item => item.morning)
  const afternoonItems = activeItemsForDate.filter(item => item.afternoon)
  const eveningItems = activeItemsForDate.filter(item => item.evening)

  const totalTablets = morningItems.length + afternoonItems.length + eveningItems.length

  const todayStr = new Date().toISOString().split('T')[0]
  const isPast = dateStr < todayStr
  const isToday = dateStr === todayStr
  
  const now = new Date()
  const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Pill className="h-5 w-5 text-primary" />
            Daily Medications ({totalTablets} scheduled)
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-foreground/80">
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        {totalTablets === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No medicine items scheduled for this date.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <TimingSectionColumn
              title="🌅 Morning"
              time={FIXED_SCHEDULE.morning}
              items={morningItems}
              badgeClassName="bg-amber-500/15 text-amber-700 dark:text-amber-300"
              isTaken={isPast || (isToday && currentHourMinute >= FIXED_SCHEDULE.morning)}
            />
            <TimingSectionColumn
              title="☀️ Afternoon"
              time={FIXED_SCHEDULE.afternoon}
              items={afternoonItems}
              badgeClassName="bg-blue-500/15 text-blue-700 dark:text-blue-300"
              isTaken={isPast || (isToday && currentHourMinute >= FIXED_SCHEDULE.afternoon)}
            />
            <TimingSectionColumn
              title="🌙 Evening"
              time={FIXED_SCHEDULE.evening}
              items={eveningItems}
              badgeClassName="bg-purple-500/15 text-purple-700 dark:text-purple-300"
              isTaken={isPast || (isToday && currentHourMinute >= FIXED_SCHEDULE.evening)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TimingSectionColumn({
  title,
  time,
  items,
  badgeClassName,
  isTaken,
}: {
  title: string
  time: string
  items: PrescriptionItemWithMedicine[]
  badgeClassName: string
  isTaken: boolean
}) {
  return (
    <div className="flex flex-col space-y-3 rounded-xl border border-border bg-muted/20 p-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{formatTime(time)}</p>
        </div>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${badgeClassName}`}>
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground bg-card/50 rounded-lg border border-dashed border-border">
            No items scheduled
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-md border border-border/50 bg-card/40 flex items-center justify-between gap-1.5"
            >
              <div>
                <h4 className="font-semibold text-xs sm:text-sm">
                  {item.medicine.medicine_name}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 shrink-0">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{formatTime(time)}</span>
                </div>
              </div>
              
              {isTaken && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 shrink-0" title="Taken">
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
