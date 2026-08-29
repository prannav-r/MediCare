// ============================================================
// src/components/prescription/MedicineSearchCombobox.tsx
// Provider Pattern UI Combobox for searching & creating catalog medicines.
//
// WHY THIS COMPONENT?
// Calls medicineSearchService (via useSearchMedicineCatalog hook) so UI is
// completely decoupled from local vs external providers. Supports immediate
// manual creation if a medicine isn't in the catalog yet.
// ============================================================

import { useState } from 'react'
import { Check, ChevronsUpDown, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

import {
  useCreateManualMedicine,
  useSearchMedicineCatalog,
} from '@/hooks/useMedicineSearch'
import type { Medicine } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface MedicineSearchComboboxProps {
  value: string // selected medicine_id
  onSelectMedicine: (medicine: Medicine) => void
  selectedMedicineName?: string
}

export function MedicineSearchCombobox({
  value,
  onSelectMedicine,
  selectedMedicineName,
}: MedicineSearchComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Manual creation state
  const [manualName, setManualName] = useState('')
  const [manualGeneric, setManualGeneric] = useState('')
  const [manualStrength, setManualStrength] = useState('')

  const { data: results = [], isLoading } = useSearchMedicineCatalog(searchQuery)
  const { mutateAsync: createMedicine, isPending: isCreating } =
    useCreateManualMedicine()

  const handleCreateManual = async () => {
    if (!manualName.trim()) {
      toast.error('Please enter a medicine name')
      return
    }

    try {
      const created = await createMedicine({
        medicine_name: manualName.trim(),
        generic_name: manualGeneric.trim() || undefined,
        strength: manualStrength.trim() || undefined,
      })

      onSelectMedicine(created)
      toast.success(`"${created.medicine_name}" added to master catalog`)
      setCreateModalOpen(false)
      setOpen(false)
      setManualName('')
      setManualGeneric('')
      setManualStrength('')
    } catch {
      toast.error('Failed to create medicine. Please try again.')
    }
  }

  return (
    <div>
      {/* Search Input Trigger */}
      <div className="relative">
        <div
          onClick={() => setOpen(true)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer shadow-xs hover:border-primary/50"
        >
          <span
            className={cn(
              'truncate',
              !value && !selectedMedicineName && 'text-muted-foreground'
            )}
          >
            {selectedMedicineName || 'Search or select a medicine...'}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </div>

      {/* Dropdown Results Modal / Combobox */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md p-4">
            <DialogHeader>
              <DialogTitle className="text-base">
                Select Medicine from Catalog
              </DialogTitle>
              <DialogDescription className="text-xs">
                Search local or external databases, or add a custom entry.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Type medicine name (e.g. Paracetamol)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>

              {/* Results list */}
              <div className="max-h-60 overflow-y-auto space-y-1 rounded-md border p-1">
                {isLoading ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Searching catalog...
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-3 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      No matching medicine found.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setManualName(searchQuery)
                        setCreateModalOpen(true)
                      }}
                      className="w-full text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Create &quot;{searchQuery || 'New Medicine'}&quot;
                    </Button>
                  </div>
                ) : (
                  results.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectMedicine(item)
                        setOpen(false)
                      }}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded text-left text-sm hover:bg-accent transition-colors',
                        value === item.id && 'bg-accent font-medium'
                      )}
                    >
                      <div>
                        <div>{item.medicine_name}</div>
                        {(item.generic_name || item.strength) && (
                          <div className="text-xs text-muted-foreground">
                            {[item.generic_name, item.strength]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        )}
                      </div>
                      {value === item.id && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              {results.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setManualName(searchQuery)
                    setCreateModalOpen(true)
                  }}
                  className="w-full text-xs text-primary"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Don&apos;t see your medicine? Create custom entry
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Manual Creation Modal */}
      {createModalOpen && (
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medicine to Master Catalog</DialogTitle>
              <DialogDescription>
                This medicine will be saved to the shared catalog for your prescriptions.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="med-name">Medicine Name *</Label>
                <Input
                  id="med-name"
                  placeholder="e.g. Amoxicillin"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-generic">Generic Name (Optional)</Label>
                <Input
                  id="med-generic"
                  placeholder="e.g. Amoxicillin Trihydrate"
                  value={manualGeneric}
                  onChange={(e) => setManualGeneric(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="med-strength">Strength / Dosage Form (Optional)</Label>
                <Input
                  id="med-strength"
                  placeholder="e.g. 500mg Capsule"
                  value={manualStrength}
                  onChange={(e) => setManualStrength(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateManual} disabled={isCreating}>
                {isCreating ? 'Saving...' : 'Add to Catalog'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
