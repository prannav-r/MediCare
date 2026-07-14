// ============================================================
// src/pages/Insights/index.tsx
// Comprehensive Medication Adherence & Analytics Dashboard (Refactored for Prescription Domain).
// ============================================================

import { useMemo } from 'react'
import {
  Activity,
  Award,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Flame,
  TrendingUp,
  XCircle,
} from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useLogsByDateRange } from '@/hooks/useMedicationLogs'
import { useAllActivePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { calculateAdherenceStats } from '@/utils/adherenceAnalytics'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function InsightsPage() {
  const { user } = useAuth()
  const { data: activeItems = [], isLoading: itemsLoading } =
    useAllActivePrescriptionItems(user?.id)

  const { startDateStr, endDateStr } = useMemo(() => {
    const now = new Date()
    const end = now.toISOString().split('T')[0]
    const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    return { startDateStr: start, endDateStr: end }
  }, [])

  const { data: logs = [], isLoading: logLoading } = useLogsByDateRange(
    user?.id,
    startDateStr,
    endDateStr
  )

  const isLoading = itemsLoading || logLoading

  const stats = useMemo(
    () => calculateAdherenceStats(logs, activeItems),
    [logs, activeItems]
  )

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Adherence Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your medication habits, adherence rates, and consistent streaks across prescription courses
          </p>
        </div>

        {isLoading ? (
          <InsightsSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Overall Adherence
                  </CardTitle>
                  <Activity className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.overallAdherence}%
                  </div>
                  <ProgressBar percentage={stats.overallAdherence} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Based on {stats.totalTaken + stats.totalMissed} logged doses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Current Streak
                  </CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.currentStreak} <span className="text-sm font-normal">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Consecutive days with 100% adherence
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Weekly Compliance
                  </CardTitle>
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.weeklyAdherence}%
                  </div>
                  <ProgressBar percentage={stats.weeklyAdherence} />
                  <p className="text-xs text-muted-foreground mt-2">
                    Past 7 days performance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Longest Streak
                  </CardTitle>
                  <Award className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stats.longestStreak} <span className="text-sm font-normal">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Personal best consistency record
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Top Performance Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-emerald-700">
                        Most Consistent Medicine
                      </div>
                      <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                        {stats.mostConsistentMedicine || 'No data yet'}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-destructive">
                        Most Missed Medicine
                      </div>
                      <div className="text-sm font-bold text-destructive">
                        {stats.mostMissedMedicine || 'None — Great job!'}
                      </div>
                    </div>
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    60-Day Dose Status Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-600">
                      {stats.totalTaken}
                    </div>
                    <div className="text-xs font-medium text-emerald-700 mt-1">
                      Taken
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="text-2xl font-bold text-destructive">
                      {stats.totalMissed}
                    </div>
                    <div className="text-xs font-medium text-destructive mt-1">
                      Missed
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted border border-border">
                    <div className="text-2xl font-bold text-foreground">
                      {activeItems.length}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground mt-1">
                      Active Items
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Prescription Medicine Adherence Breakdown
                </CardTitle>
                <CardDescription>
                  Detailed compliance rate for each prescribed medication item
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.medicineBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No medication logs recorded yet. Mark doses from your Dashboard or Calendar!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {stats.medicineBreakdown.map((item) => (
                      <div
                        key={item.itemId}
                        className="space-y-1.5 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-sm">
                              {item.medicineName}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({item.dosage})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {item.taken} taken · {item.missed} missed
                            </span>
                            <Badge
                              variant={
                                item.adherence >= 90
                                  ? 'success'
                                  : item.adherence >= 70
                                  ? 'warning'
                                  : 'destructive'
                              }
                            >
                              {item.adherence}%
                            </Badge>
                          </div>
                        </div>
                        <ProgressBar percentage={item.adherence} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  )
}

function ProgressBar({ percentage }: { percentage: number }) {
  const colorClass =
    percentage >= 90
      ? 'bg-emerald-500'
      : percentage >= 70
      ? 'bg-amber-500'
      : 'bg-destructive'

  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-1.5">
      <div
        className={cn('h-full transition-all duration-500', colorClass)}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
