// ============================================================
// src/services/medicineService.ts
// Compatibility shim mapping legacy Medicine calls to Prescription Items.
// ============================================================

import { prescriptionItemService } from './prescriptionItemService'
import type { Medicine } from '@/types'

export const medicineService = {
  async getMedicines(userId: string): Promise<Medicine[]> {
    const items = await prescriptionItemService.getAllActiveItemsForUser(userId)
    return items.map((item) => ({
      id: item.id,
      user_id: userId,
      medicine_name: item.medicine?.medicine_name ?? 'Unknown Medicine',
      dosage: item.dosage,
      meal_type: item.meal_type,
      food_relation: item.food_relation,
      custom_time: item.custom_time,
      stock: item.remaining_stock,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }))
  },

  async getMedicineById(id: string): Promise<Medicine> {
    const item = await prescriptionItemService.getItemById(id)
    return {
      id: item.id,
      medicine_name: item.medicine?.medicine_name ?? 'Unknown Medicine',
      dosage: item.dosage,
      meal_type: item.meal_type,
      food_relation: item.food_relation,
      custom_time: item.custom_time,
      stock: item.remaining_stock,
      created_at: item.created_at,
      updated_at: item.updated_at,
    }
  },

  async deleteMedicine(id: string): Promise<void> {
    await prescriptionItemService.deleteItem(id)
  },
}
