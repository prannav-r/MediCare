// ============================================================
// src/pages/Inventory/index.tsx
// Displays the user's global medicine inventory and allows stock updates.
// ============================================================

import { useState } from 'react'
import { Package, Pill, Search } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/contexts/AuthContext'
import { useAllInventory, useSetInventory } from '@/hooks/useInventory'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

import type { MedicineInventoryWithMedicine } from '@/types'

export function InventoryPage() {
  const { user } = useAuth()
  const { data: inventory = [], isLoading } = useAllInventory(user?.id)
  const { mutateAsync: setInventory } = useSetInventory()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingItem, setEditingItem] = useState<MedicineInventoryWithMedicine | null>(null)
  const [editQuantity, setEditQuantity] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  const filteredInventory = inventory.filter((item) => {
    const med = item.medicine
    const nameMatch = med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())
    const genericMatch = med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
    return nameMatch || genericMatch
  })

  const openEditDialog = (item: MedicineInventoryWithMedicine) => {
    setEditingItem(item)
    setEditQuantity(item.current_doses)
  }

  const handleSaveQuantity = async () => {
    if (!editingItem || !user) return
    
    setIsSaving(true)
    try {
      await setInventory({
        userId: user.id,
        medicineId: editingItem.medicine_id,
        currentDoses: editQuantity,
      })
      toast.success('Inventory updated successfully')
      setEditingItem(null)
    } catch (error) {
      console.error(error)
      toast.error('Failed to update inventory')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Medicine Inventory
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and update your physical stock of medicines.
            </p>
          </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading inventory...</div>
        ) : filteredInventory.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Package className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
            <h3 className="text-lg font-semibold">No medicines in inventory</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your inventory is automatically tracked when you add medicines to your prescriptions.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <Card key={item.id} className="p-5 flex flex-col justify-between hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-1.5">
                        <Pill className="h-4 w-4 text-primary" />
                        {item.medicine.medicine_name}
                      </h3>
                      {item.medicine.generic_name && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.medicine.generic_name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {item.medicine.strength && (
                    <div className="inline-flex bg-muted/50 px-2 py-0.5 rounded text-xs text-muted-foreground font-medium">
                      {item.medicine.strength}
                    </div>
                  )}
                </div>

                <div className="flex items-end justify-between mt-6 pt-4 border-t border-border/60">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                      Current Stock
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary">
                      {item.current_doses} <span className="text-sm text-muted-foreground font-sans">doses</span>
                    </p>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                    Update Stock
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Adjust your current stock for <strong>{editingItem?.medicine.medicine_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Available Doses (Tablets/Units)</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={editQuantity}
                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuantity} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
