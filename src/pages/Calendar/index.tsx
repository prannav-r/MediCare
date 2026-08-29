// ============================================================
// src/pages/Calendar/index.tsx
// Interactive monthly calendar tracking schedule for MVP 3.
// ============================================================

import { useMemo, useState } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useAllActivePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { AppLayout } from '@/components/layout/AppLayout'
import { DailyMedicationDialog } from '@/components/calendar/DailyMedicationDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const todayStr = useMemo(() => formatLocalDate(new Date()), [])

  const monthName = currentDate.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  })

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

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
      days.push({ date: d, dateStr, dayNum: prevMonthLastDate - i, isCurrentMonth: false, isToday: dateStr === todayStr })
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateStr = formatLocalDate(d)
      days.push({ date: d, dateStr, dayNum: i, isCurrentMonth: true, isToday: dateStr === todayStr })
    }

    const remainingSlots = 42 - days.length
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i)
      const dateStr = formatLocalDate(d)
      days.push({ date: d, dateStr, dayNum: i, isCurrentMonth: false, isToday: dateStr === todayStr })
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
              Medication Schedule
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Click any date to view your scheduled medicines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md bg-background">
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-semibold min-w-[140px] text-center">
                {monthName}
              </span>
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleNextMonth}>
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
              const validItemsForDay = allItems.filter((item) => {
                if (!item.prescription) return false
                return (
                  cell.dateStr >= item.prescription.start_date &&
                  cell.dateStr <= item.prescription.end_date
                )
              })
              
              const hasMorning = validItemsForDay.some(i => i.morning)
              const hasAfternoon = validItemsForDay.some(i => i.afternoon)
              const hasEvening = validItemsForDay.some(i => i.evening)
              const totalDots = (hasMorning ? 1 : 0) + (hasAfternoon ? 1 : 0) + (hasEvening ? 1 : 0)
              
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
                  </div>

                  {totalDots > 0 && (
                    <div className="mt-auto pt-2 flex flex-wrap gap-1">
                      {hasMorning && <span className="h-2 w-2 rounded-full bg-amber-500" title="Morning" />}
                      {hasAfternoon && <span className="h-2 w-2 rounded-full bg-blue-500" title="Afternoon" />}
                      {hasEvening && <span className="h-2 w-2 rounded-full bg-purple-500" title="Evening" />}
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
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Morning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>Afternoon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span>Evening</span>
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
          items={allItems}
        />
      )}
    </AppLayout>
  )
}
