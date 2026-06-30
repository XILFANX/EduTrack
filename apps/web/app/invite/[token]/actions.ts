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

  // 1. Validate the invitation
  const { data: invitation } = await admin
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (!invitation) return { error: 'This invite link is invalid.' }
  if (invitation.used_at) return { error: 'This invite has already been used. Please log in.' }

  // 2. Verify phone matches what the principal registered
  const normalize = (p: string) => p.replace(/\s+/g, '').replace(/^0/, '+254')
  if (normalize(invitation.phone) !== normalize(phone) && invitation.phone !== phone) {
    return { error: 'This phone number does not match our records. Please contact your school administrator.' }
  }

  // 3. Create the auth user (using a synthetic email)
  const syntheticEmail = `${token}@edutrack.internal`
  const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
  })

  if (createErr || !newUser.user) {
    return { error: 'Failed to create your account. Please try again.' }
  }

  // 4. Insert their profile into the users table
  const { error: profileError } = await admin.from('users').insert({
    id: newUser.user.id,
    school_id: invitation.school_id,
    role: invitation.role,
    full_name: invitation.name,
    phone_number: invitation.phone,
  })

  if (profileError) {
    return { error: 'Failed to create your profile.' }
  }

  // 5. Mark the invitation as used
  await admin
    .from('invitations')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // 6. Sign them in
  const supabase = await createClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password,
  })

  if (signInErr) {
    return { error: 'Account created, but sign-in failed. Please visit /login.' }
  }

  // 7. Route to correct portal
  redirect(ROLE_PORTAL[invitation.role] ?? '/login')
}
