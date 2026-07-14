// ============================================================
// src/pages/PrescriptionDetails/index.tsx
// Prescription Details Page showing Doctor info & prescribed Medicine items.
// ============================================================

import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Hospital,
  Pill,
  PlusCircle,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  useDeletePrescriptionItem,
  usePrescriptionItems,
} from '@/hooks/usePrescriptionItems'
import { usePrescription } from '@/hooks/usePrescriptions'
import {
  FOOD_RELATION_LABELS,
  MEAL_TYPE_LABELS,
  PRESCRIPTION_STATUS_LABELS,
} from '@/types'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const MEAL_EMOJIS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export function PrescriptionDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: prescription, isLoading: prescLoading } = usePrescription(id)
  const { data: items = [], isLoading: itemsLoading } = usePrescriptionItems(id)
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
        <div className="py-12 text-center text-muted-foreground">
          Loading prescription details...
        </div>
      </AppLayout>
    )
  }

  if (!prescription) {
    return (
      <AppLayout>
        <div className="py-12 text-center space-y-4">
          <p className="text-muted-foreground">Prescription not found.</p>
          <Button onClick={() => navigate('/prescriptions')}>
            Back to Prescriptions
          </Button>
        </div>
      </AppLayout>
    )
  }

  const startDate = new Date(prescription.start_date)
  const endDate = new Date(prescription.end_date)
  const durationDays =
    Math.max(
      1,
      Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    ) + 1

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/prescriptions')}
          className="-ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Prescriptions
        </Button>

        {/* Prescription Header Info */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{prescription.title}</h1>
                <Badge
                  variant={
                    prescription.status === 'active' ? 'success' : 'secondary'
                  }
                  className="capitalize"
                >
                  {PRESCRIPTION_STATUS_LABELS[prescription.status]}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <UserCheck className="h-4 w-4 text-primary" />
                  {prescription.doctor_name}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Hospital className="h-4 w-4" />
                  {prescription.hospital_name}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {prescription.start_date} → {prescription.end_date} (
                  {durationDays} days)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/prescriptions/${prescription.id}/edit`)}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                Edit Prescription
              </Button>
            </div>
          </div>

          {prescription.description && (
            <p className="text-sm text-muted-foreground pt-2 border-t border-border/60">
              {prescription.description}
            </p>
          )}
        </Card>

        {/* Prescribed Medicines Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Prescribed Medicine Items ({items.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Every medicine prescribed under this doctor&apos;s course
            </p>
          </div>

          <Link to={`/prescriptions/${prescription.id}/items/new`}>
            <Button size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Medicine Item
            </Button>
          </Link>
        </div>

        {/* Medicine Items List */}
        {itemsLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading medicine items...
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Pill className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-base font-semibold">
              No medicine items added yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Search the medicine catalog or add custom medicine definitions to track dosages.
            </p>
            <Link to={`/prescriptions/${prescription.id}/items/new`}>
              <Button size="sm" className="mt-2">
                <PlusCircle className="h-4 w-4 mr-1.5" />
                Add Medicine Item
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
              const med = item.medicine
              if (!med) return null

              const isLowStock = item.remaining_stock <= 5

              return (
                <Card
                  key={item.id}
                  className="p-4 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-foreground">
                          {med.medicine_name}
                        </h4>
                        {(med.generic_name || med.strength) && (
                          <p className="text-xs text-muted-foreground">
                            {[med.generic_name, med.strength]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>

                      <Badge
                        variant={isLowStock ? 'destructive' : 'secondary'}
                        className="text-xs shrink-0"
                      >
                        Stock: {item.remaining_stock}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1">
                      <span className="font-semibold text-foreground">
                        {item.dosage}
                      </span>
                      <span>·</span>
                      <span>
                        {MEAL_EMOJIS[item.meal_type]}{' '}
                        {MEAL_TYPE_LABELS[item.meal_type]}
                      </span>
                      <span>·</span>
                      <span>{FOOD_RELATION_LABELS[item.food_relation]}</span>
                      {item.custom_time && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1 text-primary font-medium">
                            <Clock className="h-3 w-3" />
                            {item.custom_time}
                          </span>
                        </>
                      )}
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic bg-muted/30 p-2 rounded">
                        &quot;{item.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                    <span>
                      Freq: {item.daily_frequency}x daily · Qty/dose:{' '}
                      {item.quantity_per_dose}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          navigate(
                            `/prescriptions/${prescription.id}/items/${item.id}/edit`
                          )
                        }
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() =>
                          handleDeleteItem(item.id, med.medicine_name)
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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
