// ============================================================
// src/pages/Dashboard/index.tsx
// Refactored Dashboard Page for MVP 3.
// Displays Today's fixed schedule and low stock alerts.
// ============================================================

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Clock, FileText, PlusCircle, Pill } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { useAllActivePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { usePrescriptions } from '@/hooks/usePrescriptions'
import { useAllInventory } from '@/hooks/useInventory'
import { getInventoryStatus, calculateConsumedDoses } from '@/utils/doseCalculator'
import { FIXED_SCHEDULE } from '@/types'
import { formatTime } from '@/lib/utils'

import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const { user } = useAuth()

  const { data: prescriptions = [], isLoading: prescLoading } = usePrescriptions(user?.id)
  const { data: activeItems = [], isLoading: itemsLoading } = useAllActivePrescriptionItems(user?.id)
  const { data: inventory = [], isLoading: invLoading } = useAllInventory(user?.id)

  const activePrescriptions = useMemo(() => prescriptions, [prescriptions])

  // Compute Low Stock
  const lowStockItems = useMemo(() => {
    const alerts: Array<{ medicineName: string; current: number; required: number; shortage: number }> = []

    for (const item of activeItems) {
      if (!item.prescription) continue
      
      const inv = inventory.find(i => i.medicine_id === item.medicine_id)
      const currentDoses = inv?.current_doses ?? 0
      
      const consumed = calculateConsumedDoses(
        item.prescription.start_date,
        item.prescription.end_date,
        item.morning,
        item.afternoon,
        item.evening,
        item.quantity_per_dose
      )

      const status = getInventoryStatus(currentDoses, item.total_required_doses, consumed)
      
      if (status.isLowStock) {
        alerts.push({
          medicineName: item.medicine.medicine_name,
          current: currentDoses,
          required: status.remainingRequired,
          shortage: status.shortage
        })
      }
    }
    
    // Deduplicate by medicine name if same medicine is in multiple prescriptions and triggers alert
    const uniqueAlerts = new Map()
    for (const alert of alerts) {
      if (!uniqueAlerts.has(alert.medicineName)) {
        uniqueAlerts.set(alert.medicineName, alert)
      }
    }
    
    return Array.from(uniqueAlerts.values())
  }, [activeItems, inventory])

  // Compute Today's Schedule
  const todaySchedule = useMemo(() => {
    const morning: typeof activeItems = []
    const afternoon: typeof activeItems = []
    const evening: typeof activeItems = []

    for (const item of activeItems) {
      if (item.morning) morning.push(item)
      if (item.afternoon) afternoon.push(item)
      if (item.evening) evening.push(item)
    }

    return [
      { label: 'Morning', time: FIXED_SCHEDULE.morning, items: morning },
      { label: 'Afternoon', time: FIXED_SCHEDULE.afternoon, items: afternoon },
      { label: 'Evening', time: FIXED_SCHEDULE.evening, items: evening },
    ].filter(g => g.items.length > 0)
  }, [activeItems])

  const isLoading = prescLoading || itemsLoading || invLoading

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activePrescriptions.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Medicine Items</CardTitle>
                <Pill className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeItems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
                <AlertTriangle className={lowStockItems.length > 0 ? 'h-4 w-4 text-destructive' : 'h-4 w-4 text-muted-foreground'} />
              </CardHeader>
              <CardContent>
                <div className={lowStockItems.length > 0 ? 'text-3xl font-bold text-destructive' : 'text-3xl font-bold'}>
                  {lowStockItems.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockItems.length > 0 ? 'Medicines need refill' : 'All stocks healthy'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Low Stock Banner */}
        {lowStockItems.length > 0 && (
          <Card className="p-4 border-destructive/40 bg-destructive/5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <h4 className="font-semibold text-sm text-destructive">
                Refill Needed ({lowStockItems.length} items running low)
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {lowStockItems.map(alert => (
                <div key={alert.medicineName} className="bg-background border rounded p-3 text-sm flex justify-between items-center">
                  <span className="font-medium">{alert.medicineName}</span>
                  <div className="text-right">
                    <span className="text-destructive font-bold">{alert.shortage} short</span>
                    <p className="text-xs text-muted-foreground">{alert.current} / {alert.required} avail.</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Today&apos;s Scheduled Medications</span>
              <span className="text-xs font-normal text-muted-foreground">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
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
                <h4 className="font-semibold text-base">No medicines scheduled for today</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add a prescription with medicine items to generate your daily reminder checklist.
                </p>
                <Link to="/prescriptions/new">
                  <Button size="sm">Create Prescription</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {todaySchedule.map((group) => (
                  <div key={group.label} className="space-y-3">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{group.label} — {formatTime(group.time)}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.items.map(item => (
                        <div key={item.id} className="p-3 bg-muted/30 rounded-lg border flex items-center justify-between">
                          <span className="font-medium">{item.medicine.medicine_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
