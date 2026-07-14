// ============================================================
// src/pages/Prescriptions/index.tsx
// Doctor Prescriptions List Page.
//
// WHY THIS PAGE?
// Displays all medical prescriptions organized by status and allows
// searching across doctors, hospitals, and titles.
// ============================================================

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Edit2,
  FileText,
  Hospital,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import {
  useDeletePrescription,
  usePrescriptions,
} from '@/hooks/usePrescriptions'
import type { PrescriptionStatus } from '@/types'
import { PRESCRIPTION_STATUS_LABELS } from '@/types'
import { AppLayout } from '@/components/layout/AppLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function PrescriptionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: prescriptions = [], isLoading } = usePrescriptions(user?.id)
  const { mutateAsync: deletePrescription } = useDeletePrescription()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.hospital_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [prescriptions, searchQuery, statusFilter])

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return
    try {
      await deletePrescription(id)
      toast.success('Prescription deleted')
    } catch {
      toast.error('Failed to delete prescription')
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Doctor Prescriptions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage medical prescriptions, doctor schedules, and prescribed items
            </p>
          </div>

          <Link to="/prescriptions/new">
            <Button className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Prescription
            </Button>
          </Link>
        </div>

        {/* Search & Status Tabs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by diagnosis, doctor, or hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'active', 'completed', 'cancelled'].map((tab) => (
              <Button
                key={tab}
                variant={statusFilter === tab ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab)}
                className="capitalize"
              >
                {tab === 'all'
                  ? 'All'
                  : PRESCRIPTION_STATUS_LABELS[tab as PrescriptionStatus]}
              </Button>
            ))}
          </div>
        </div>

        {/* List Grid */}
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">
            Loading prescriptions...
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-lg font-semibold">No prescriptions found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Get started by adding your first doctor prescription to organize your medical routine.
            </p>
            <Link to="/prescriptions/new">
              <Button size="sm" className="mt-2">
                Create First Prescription
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPrescriptions.map((p) => {
              const badgeVariant =
                p.status === 'active'
                  ? 'success'
                  : p.status === 'completed'
                  ? 'secondary'
                  : 'destructive'

              return (
                <Card
                  key={p.id}
                  onClick={() => navigate(`/prescriptions/${p.id}`)}
                  className="p-5 cursor-pointer hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">
                          {p.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <UserCheck className="h-3.5 w-3.5 text-primary" />
                            {p.doctor_name}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Hospital className="h-3.5 w-3.5" />
                            {p.hospital_name}
                          </span>
                        </div>
                      </div>

                      <Badge variant={badgeVariant as any} className="capitalize">
                        {PRESCRIPTION_STATUS_LABELS[p.status]}
                      </Badge>
                    </div>

                    {p.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-border/60 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span>
                        {p.start_date} → {p.end_date}
                      </span>
                    </div>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => navigate(`/prescriptions/${p.id}/edit`)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(p.id, p.title)}
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
