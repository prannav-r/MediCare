// ============================================================
// src/pages/PrescriptionDetails/index.tsx
// Prescription Details Page showing Doctor info & prescribed Medicine items.
// ============================================================

import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Edit2,
  Pill,
  PlusCircle,
  Trash2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useDeletePrescriptionItem, usePrescriptionItems } from '@/hooks/usePrescriptionItems'
import { usePrescription } from '@/hooks/usePrescriptions'
import { useAllInventory } from '@/hooks/useInventory'
import { calculateConsumedDoses, getInventoryStatus } from '@/utils/doseCalculator'

import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function PrescriptionDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: prescription, isLoading: prescLoading } = usePrescription(id)
  const { data: items = [], isLoading: itemsLoading } = usePrescriptionItems(id)
  const { data: inventory = [], isLoading: invLoading } = useAllInventory(user?.id)
  const { mutateAsync: deleteItem } = useDeletePrescriptionItem()

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from this prescription?`)) return
    try {
      await deleteItem(itemId)
      toast.success('Medicine removed from prescription')
    } catch {
      toast.error('Failed to remove medicine')
    }
  }

  if (prescLoading) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-muted-foreground">Loading prescription details...</div>
      </AppLayout>
    )
  }

  if (!prescription) {
    return (
      <AppLayout>
        <div className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">Prescription not found.</p>
          <Button onClick={() => navigate('/prescriptions')}>Back to Prescriptions</Button>
        </div>
      </AppLayout>
    )
  }

  const startDate = new Date(prescription.start_date)
  const endDate = new Date(prescription.end_date)
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))) + 1

  const isLoading = itemsLoading || invLoading

  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/prescriptions')} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Button>

        {/* Prescription Header Info */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{prescription.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                {prescription.doctor_name && (
                  <>
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <UserCheck className="h-4 w-4 text-primary" />
                      {prescription.doctor_name}
                    </span>
                    <span>·</span>
                  </>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {prescription.start_date} → {prescription.end_date} ({durationDays} days)
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/prescriptions/${prescription.id}/edit`)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Edit Prescription
            </Button>
          </div>
        </Card>

        {/* Prescribed Medicines Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Prescribed Medicine Items ({items.length})
            </h2>
          </div>
          <Link to={`/prescriptions/${prescription.id}/items/new`}>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </Link>
        </div>

        {/* Medicine Items List */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading medicine items...</div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Pill className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-base font-semibold">No medicines added yet</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Add a medicine to define when it should be taken during this prescription course.
            </p>
            <Link to={`/prescriptions/${prescription.id}/items/new`}>
              <Button size="sm" className="mt-2">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add Medicine
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const med = item.medicine
              if (!med) return null

              const inv = inventory.find(i => i.medicine_id === item.medicine_id)
              const currentDoses = inv?.current_doses ?? 0

              const consumed = calculateConsumedDoses(
                prescription.start_date,
                prescription.end_date,
                item.morning,
                item.afternoon,
                item.evening
              )

              const status = getInventoryStatus(currentDoses, item.total_required_doses, consumed)

              return (
                <Card key={item.id} className="p-4 space-y-4 flex flex-col justify-between border-border/60 shadow-xs hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg text-foreground">{med.medicine_name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.total_required_doses} doses required
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(`/prescriptions/${prescription.id}/items/${item.id}/edit`)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleDeleteItem(item.id, med.medicine_name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant={item.morning ? "default" : "outline"} className={!item.morning ? "opacity-40" : ""}>Morning</Badge>
                    <Badge variant={item.afternoon ? "default" : "outline"} className={!item.afternoon ? "opacity-40" : ""}>Afternoon</Badge>
                    <Badge variant={item.evening ? "default" : "outline"} className={!item.evening ? "opacity-40" : ""}>Evening</Badge>
                  </div>

                  <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground mr-1">Inventory:</span>
                      <span className="font-semibold">{currentDoses} doses</span>
                    </div>

                    {status.isLowStock && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Low Stock: {status.shortage} needed
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
