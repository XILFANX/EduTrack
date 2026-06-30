'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function logStock(data: {
  schoolId: string
  userId: string
  itemName: string
  quantityChange: number  // positive = stock in, negative = stock out
  notes: string
}) {
  const admin = await createAdminClient()

  const { error } = await admin.from('inventory_ledger').insert({
    school_id: data.schoolId,
    item_name: data.itemName,
    quantity_change: data.quantityChange,
    recorded_by: data.userId,
    notes: data.notes || null,
  })

  if (error) {
    console.error('Log stock error:', error)
    return { error: error.message }
  }

  revalidatePath('/store/dashboard')
  revalidatePath('/store/ledger')
  return { success: true }
}
