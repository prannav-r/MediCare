// ============================================================
// src/pages/Calendar/index.tsx
// Interactive monthly calendar tracking page (Refactored for Prescription Domain).
// ============================================================

import { useMemo, useState } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useLogsByDateRange } from '@/hooks/useMedicationLogs'
import { useAllActivePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { useProfile } from '@/hooks/useProfile'
import { AppLayout } from '@/components/layout/AppLayout'
import { DailyMedicationDialog } from '@/components/calendar/DailyMedicationDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function CalendarPage() {
  const { user } = useAuth()
  const { data: allItems = [] } = useAllActivePrescriptionItems(user?.id)
  const { data: profile } = useProfile()

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [mealFilter, setMealFilter] = useState<string>('all')
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  const activeItems = useMemo(() => {
    if (mealFilter === 'all') return allItems
    return allItems.filter((item) => item.meal_type === mealFilter)
  }, [allItems, mealFilter])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDateStr = formatLocalDate(firstDayOfMonth)
  const endDateStr = formatLocalDate(lastDayOfMonth)

  const { data: monthlyLogs = [] } = useLogsByDateRange(
    user?.id,
    startDateStr,
    endDateStr
  )

  const logsByDate = useMemo(() => {
    const map = new Map<
      string,
      { takenCount: number; missedCount: number; totalLogged: number }
    >()

    for (const log of monthlyLogs) {
      const current = map.get(log.scheduled_date) || {
        takenCount: 0,
        missedCount: 0,
        totalLogged: 0,
      }
      current.totalLogged++
      if (log.status === 'taken') current.takenCount++
      if (log.status === 'missed') current.missedCount++
      map.set(log.scheduled_date, current)
    }

    return map
  }, [monthlyLogs])

  const todayStr = useMemo(() => formatLocalDate(new Date()), [])

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const calendarDays = useMemo(() => {
    const startDayOfWeek = firstDayOfMonth.getDay()
    const totalDaysInMonth = lastDayOfMonth.getDate()

    const days: Array<{
      date: Date
      dateStr: string
      dayNum: number
      isCurrentMonth: boolean
      isToday: boolean
    }> = []

    const prevMonthLastDate = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i)
      const dateStr = formatLocalDate(d)
      days.push({
        date: d,
        dateStr,
        dayNum: prevMonthLastDate - i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      })
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = formatLocalDate(d)
      days.push({
        date: d,
        dateStr,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      })
    }

    const remainingSlots = 42 - days.length
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i)
      const dateStr = formatLocalDate(d)
      days.push({
        date: d,
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      })
    }

    return days
  }, [year, month, firstDayOfMonth, lastDayOfMonth, todayStr])

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              Medication Schedule Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Click any date to view and log your prescribed daily medicines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={mealFilter} onValueChange={setMealFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Filter Meal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meals</SelectItem>
                <SelectItem value="breakfast">🌅 Breakfast</SelectItem>
                <SelectItem value="lunch">☀️ Lunch</SelectItem>
                <SelectItem value="dinner">🌙 Dinner</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-semibold min-w-[140px] text-center">
                {monthName}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="p-4 sm:p-6 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-medium text-xs text-muted-foreground pb-2 border-b">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-2">
            {calendarDays.map((cell) => {
              const stats = logsByDate.get(cell.dateStr)
              const validItemsForDay = activeItems.filter((item) => {
                if (!item.prescription) return true
                if (item.prescription.status !== 'active') return false
                return (
                  cell.dateStr >= item.prescription.start_date &&
                  cell.dateStr <= item.prescription.end_date
                )
              })
              const scheduledCount = validItemsForDay.reduce((acc, item) => {
                const meals =
                  item.meal_types && item.meal_types.length > 0
                    ? item.meal_types
                    : [item.meal_type]
                return acc + meals.length
              }, 0)

              const hasAllCompleted =
                scheduledCount > 0 &&
                stats &&
                stats.takenCount >= scheduledCount
              const hasMissed = stats && stats.missedCount > 0

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={cn(
                    'min-h-[85px] sm:min-h-[105px] p-2 rounded-lg border text-left flex flex-col justify-between transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40',
                    cell.isCurrentMonth
                      ? 'bg-card border-border'
                      : 'bg-muted/30 border-transparent opacity-50',
                    cell.isToday && 'ring-2 ring-primary border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={cn(
                        'text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full',
                        cell.isToday && 'bg-primary text-primary-foreground'
                      )}
                    >
                      {cell.dayNum}
                    </span>

                    <div className="flex gap-1">
                      {hasAllCompleted && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      )}
                      {hasMissed && (
                        <span className="h-2 w-2 rounded-full bg-destructive" />
                      )}
                    </div>
                  </div>

                  {scheduledCount > 0 && (
                    <div className="mt-auto pt-2">
                      {hasAllCompleted ? (
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                          ✓ All Taken
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded inline-block">
                          Pending
                        </div>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>All completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span>Missed dose(s)</span>
          </div>
        </div>
      </div>

      {selectedDateStr && (
        <DailyMedicationDialog
          open={!!selectedDateStr}
          onOpenChange={(open) => {
            if (!open) setSelectedDateStr(null)
          }}
          dateStr={selectedDateStr}
          items={activeItems}
          profile={profile ?? null}
        />
      )}
    </AppLayout>
  )
}
