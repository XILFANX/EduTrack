'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createFeeStructure(data: {
  schoolId: string
  termId: string
  classId: string | null
  amount: number
  description: string
}) {
  const supabase = await createClient()

  // Verify auth & role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'bursar' && profile?.role !== 'principal' && profile?.role !== 'admin') {
    return { error: 'Unauthorized.' }
  }

  const { error } = await supabase.from('fee_structures').insert({
    school_id: data.schoolId,
    term_id: data.termId,
    class_id: data.classId || null,
    amount: data.amount,
    description: data.description,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/bursar/fee-structures')
  return { success: true }
}
