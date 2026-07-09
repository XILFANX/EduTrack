'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAccountSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fullName = formData.get('full_name')?.toString()
  const phone = formData.get('phone')?.toString()

  if (!fullName || fullName.trim() === '') {
    return { error: 'Full name is required' }
  }

  const { error } = await supabase
    .from('users')
    .update({
      full_name: fullName,
      phone_number: phone || null,
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/account')
  return { success: true }
}
