// ============================================================
// src/components/medicine/MedicineCard.tsx
// Displays a single medicine with edit/delete actions.
// ============================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Pill, Clock, Utensils } from 'lucide-react'
import { toast } from 'sonner'

import type { Medicine } from '@/types'
import { MEAL_TYPE_LABELS, FOOD_RELATION_LABELS } from '@/types'
import { useDeleteMedicine } from '@/hooks/useMedicines'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatTime, getStockStatus } from '@/lib/utils'

interface MedicineCardProps {
  medicine: Medicine
}

// Meal emoji mapping
const MEAL_EMOJIS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }

export function MedicineCard({ medicine }: MedicineCardProps) {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteMedicine, isPending } = useDeleteMedicine()

  const stockStatus = getStockStatus(medicine.stock)

  const handleDelete = async () => {
    try {
      await deleteMedicine(medicine.id)
      toast.success(`${medicine.medicine_name} removed successfully.`)
      setOpen(false)
    } catch {
      toast.error('Failed to delete medicine. Please try again.')
    }
  }

  return (
    <Card className="group flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardContent className="flex-1 p-5">
        {/* ── Card Header ───────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base leading-tight truncate">
                {medicine.medicine_name}
              </h3>
              <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
            </div>
          </div>

          {/* Stock Badge */}
          <Badge
            variant={
              stockStatus === 'critical'
                ? 'destructive'
                : stockStatus === 'low'
                ? 'warning'
                : 'success'
            }
            className="shrink-0 whitespace-nowrap"
          >
            {medicine.stock === 0 ? 'Out of stock' : `${medicine.stock} left`}
          </Badge>
        </div>

        {/* ── Details ───────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Utensils className="h-3.5 w-3.5 shrink-0" />
            <span>
              {MEAL_EMOJIS[medicine.meal_type]} {MEAL_TYPE_LABELS[medicine.meal_type]}
            </span>
            <span className="text-border">·</span>
            <span>{FOOD_RELATION_LABELS[medicine.food_relation]}</span>
          </div>

          {medicine.food_relation === 'anytime' && medicine.custom_time && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Custom time: {formatTime(medicine.custom_time)}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* ── Card Footer (Actions) ──────────────────────────── */}
      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1"
          id={`edit-medicine-${medicine.id}`}
        >
          <Link to={`/medicines/${medicine.id}/edit`}>
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit
          </Link>
        </Button>

        {/* Delete with Confirmation Dialog */}
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
              id={`delete-medicine-${medicine.id}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{' '}
                <strong>{medicine.medicine_name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                id={`confirm-delete-${medicine.id}`}
              >
                {isPending ? 'Deleting...' : 'Delete Medicine'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
