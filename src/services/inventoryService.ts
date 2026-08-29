// ============================================================
// src/services/inventoryService.ts
// Service layer for Medicine Inventory.
// ============================================================

import { supabase } from '@/lib/supabase'
import type { MedicineInventory, MedicineInventoryWithMedicine } from '@/types'

export const inventoryService = {
  // ── 1. Get All Inventory for User ─────────────────────────
  async getAllInventory(userId: string): Promise<MedicineInventoryWithMedicine[]> {
    const { data, error } = await supabase
      .from('medicine_inventory')
      .select('*, medicine:medicines(*)')
      .eq('user_id', userId)

    if (error) throw error
    return (data as unknown as MedicineInventoryWithMedicine[]) ?? []
  },

  // ── 2. Get Single Inventory Item by Medicine ID ────────────
  async getInventory(userId: string, medicineId: string): Promise<MedicineInventory | null> {
    const { data, error } = await supabase
      .from('medicine_inventory')
      .select('*')
      .eq('user_id', userId)
      .eq('medicine_id', medicineId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // ── 3. Set Inventory Level (Upsert) ────────────────────────
  async setInventory(userId: string, medicineId: string, currentDoses: number): Promise<MedicineInventory> {
    const { data, error } = await supabase
      .from('medicine_inventory')
      .upsert(
        {
          user_id: userId,
          medicine_id: medicineId,
          current_doses: currentDoses
        },
        { 
          onConflict: 'user_id, medicine_id'
        }
      )
      .select()
      .single()

    if (error) throw error
    return data
  }
}
