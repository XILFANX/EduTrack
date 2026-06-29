'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

const ROLE_PORTAL: Record<string, string> = {
  class_teacher:    '/teacher/dashboard',
  subject_teacher:  '/teacher/dashboard',
  bursar:           '/bursar/dashboard',
  librarian:        '/library/dashboard',
  storekeeper:      '/store/dashboard',
  transport_matron: '/transport/dashboard',
  parent:           '/parent/dashboard',
}

export async function activatePortal(formData: FormData) {
  const token    = formData.get('token') as string
  const phone    = formData.get('phone') as string
  const password = formData.get('password') as string

  const admin = createAdminClient()
  const fakeEmail = `${token}@edutrack.internal`

  // 1. Find auth user by token-based email
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
  if (listError) return { error: 'Could not look up invite. Please try again.' }

  const authUser = users.find((u) => u.email === fakeEmail)
  if (!authUser) return { error: 'This invite link is invalid or has expired.' }

  // 2. Verify phone matches what the principal registered
  const { data: profile } = await admin
    .from('users')
    .select('id, role, phone_number, full_name')
    .eq('id', authUser.id)
    .single()

  if (!profile) return { error: 'Account profile not found.' }

  const normalize = (p: string) => p.replace(/\s+/g, '').replace(/^0/, '+254')
  if (normalize(profile.phone_number) !== normalize(phone) && profile.phone_number !== phone) {
    return { error: 'This phone number does not match our records. Please contact your school administrator.' }
  }

  // 3. Set password on the auth user
  const { error: updateError } = await admin.auth.admin.updateUserById(authUser.id, { password })
  if (updateError) return { error: `Failed to set password: ${updateError.message}` }

  // 4. Sign them in with their new password
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: fakeEmail, password })
  if (signInError) return { error: `Sign-in failed: ${signInError.message}` }

  // 5. Route to correct portal
  redirect(ROLE_PORTAL[profile.role] ?? '/login')
}
