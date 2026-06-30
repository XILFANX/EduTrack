'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSubAdmin(data: {
  fullName: string
  email: string
  phoneNumber: string
}) {
  const admin = await createAdminClient()

  // 1. Create in auth.users (if not exists)
  // We can just use standard insert or let them sign up via magic link
  // But since this is a platform admin, we'll upsert them into auth.users via admin API
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
  })

  if (authError && authError.status !== 422) {
    // 422 means email already exists, which is fine, we'll try to find the user
    return { error: authError.message }
  }

  let userId = authUser?.user?.id

  // If user already existed, fetch their ID
  if (!userId) {
    // We need to find the user by email if we can't create them.
    // Supabase admin API doesn't have an easy get_user_by_email, so we can check the `users` table
    const { data: existing } = await admin.from('users').select('id').eq('email', data.email).single()
    if (existing) {
      userId = existing.id
    } else {
      return { error: 'User already exists in Auth but not in public.users. Please contact support.' }
    }
  }

  // 2. Upsert into public.users with role = 'admin'
  const { error: userError } = await admin.from('users').upsert({
    id: userId,
    full_name: data.fullName,
    email: data.email,
    phone_number: data.phoneNumber,
    role: 'admin',
    // school_id is null for platform admins
  }, { onConflict: 'id' })

  if (userError) {
    return { error: userError.message }
  }

  revalidatePath('/admin/admins')
  return { success: true }
}
