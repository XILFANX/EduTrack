'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { sendSmsOtp } from '@/lib/notifications'

const ROLE_PORTAL: Record<string, string> = {
  class_teacher:    '/teacher/dashboard',
  subject_teacher:  '/teacher/dashboard',
  bursar:           '/bursar/dashboard',
  librarian:        '/library/dashboard',
  storekeeper:      '/store/dashboard',
  transport_matron: '/transport/dashboard',
  parent:           '/parent/dashboard',
}

/**
 * Handles all invite-related actions: register, login, send_otp, otp (reset).
 * Exact port of EstateTrack's battle-tested invite logic.
 * Auth is phone-only via a synthetic email — invisible to the user.
 */
export async function activateInvite(formData: FormData) {
  const actionType = formData.get('actionType') as string
  const token      = formData.get('token') as string
  const inviteId   = formData.get('inviteId') as string

  const admin = createAdminClient()

  // 1. Re-fetch invite to validate
  const { data: inviteRaw } = await admin
    .from('invitations')
    .select('id, token, role, target_phone, target_name, target_salutation, target_entity_id, school_id, used_at, reset_otp, reset_otp_expires_at')
    .eq('id', inviteId)
    .eq('token', token)
    .single()

  const invite = inviteRaw as any

  if (!invite) {
    return { error: 'This invite link is invalid or has been removed.' }
  }

  // 2. Handle OTP Generation & Sending
  if (actionType === 'send_otp') {
    if (!invite.target_phone) {
      return { error: 'No phone number is registered for this invite.' }
    }

    // Generate a secure 6-digit OTP
    const otpCode  = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString() // 15 mins

    const { error: updateErr } = await admin
      .from('invitations')
      .update({ reset_otp: otpCode, reset_otp_expires_at: expiresAt })
      .eq('id', invite.id)

    if (updateErr) {
      return { error: 'Failed to generate reset code. Please try again.' }
    }

    await sendSmsOtp(invite.target_phone, otpCode)
    return { success: true }
  }

  // Common fields for register, login, and OTP verify
  const name     = (formData.get('name') as string || invite.target_name || '').trim()
  const phone    = (formData.get('phone') as string || invite.target_phone || '').trim()
  const password = formData.get('password') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // 3. Phone security gate — validate on registration
  if (actionType === 'register' && invite.target_phone) {
    const normalize = (p: string) => p.replace(/[\s\-\(\)]/g, '').replace(/^0/, '+254')
    if (normalize(phone) !== normalize(invite.target_phone)) {
      return { error: 'That phone number does not match our records. Please contact your school administrator.' }
    }
  }

  // 4. Synthetic email (invisible to user — just the auth mechanism)
  const syntheticEmail = `${token}@invite.edutrack.app`
  const supabase = await createClient()

  // 5. Handle Login (Returning User)
  if (actionType === 'login') {
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInErr) {
      return { error: 'Incorrect password. Please try again or reset it.' }
    }

    redirect(ROLE_PORTAL[invite.role] ?? '/')
  }

  // 6. Handle Reset Password via OTP
  if (actionType === 'otp') {
    const userOtp = (formData.get('otp') as string || '').trim()

    if (!invite.reset_otp || !invite.reset_otp_expires_at) {
      return { error: 'No active password reset request found.' }
    }

    if (new Date(invite.reset_otp_expires_at) < new Date()) {
      return { error: 'The OTP has expired. Please request a new one.' }
    }

    if (invite.reset_otp !== userOtp) {
      return { error: 'Incorrect OTP. Please check the code and try again.' }
    }

    // Locate the Auth user by synthetic email
    const { data: usersData } = await admin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email === syntheticEmail)

    if (!existingUser) {
      return { error: 'User account not found.' }
    }

    // Update password
    const { error: updateErr } = await admin.auth.admin.updateUserById(existingUser.id, { password })
    if (updateErr) {
      return { error: 'Could not update your credentials. Please try again.' }
    }

    // Clear the OTP
    await admin
      .from('invitations')
      .update({ reset_otp: null, reset_otp_expires_at: null })
      .eq('id', invite.id)

    // Sign them in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInErr) {
      return { error: 'Password updated, but sign-in failed. Please try logging in.' }
    }

    redirect(ROLE_PORTAL[invite.role] ?? '/')
  }

  // 7. Handle First-Time Registration
  if (actionType === 'register') {
    if (invite.used_at) {
      return { error: 'This invite has already been used. Please log in.' }
    }

    // Create auth user with synthetic email
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, phone, invite_token: token },
    })

    if (createErr || !newUser.user) {
      console.error('Create user error:', createErr)
      return { error: 'Failed to create your account. Please try again.' }
    }

    const userId = newUser.user.id

    // Insert profile into users table
    const { error: profileErr } = await admin.from('users').insert({
      id: userId,
      school_id: invite.school_id,
      role: invite.role,
      full_name: name,
      phone_number: phone,
      salutation: invite.target_salutation || null,
    })

    if (profileErr) {
      console.error('Profile insert error:', profileErr)
      return { error: 'Account created but profile setup failed. Please contact your school administrator.' }
    }

    // Link target_entity_id if parent
    if (invite.role === 'parent' && invite.target_entity_id) {
      const { error: linkErr } = await admin.from('student_parents').insert({
        student_id: invite.target_entity_id,
        parent_id: userId,
        relationship: 'Guardian' // Default, can be updated later
      });
      if (linkErr) {
        console.error('Parent linking error:', linkErr);
      }
    }


    // Mark invite as used (keep target_name updated to whatever they entered)
    await admin
      .from('invitations')
      .update({ used_at: new Date().toISOString(), target_name: name })
      .eq('id', invite.id)

    // Sign them in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInErr) {
      return { error: 'Account created but could not sign you in. Please try logging in again.' }
    }

    redirect(ROLE_PORTAL[invite.role] ?? '/')
  }

  return { error: 'Invalid action type.' }
}
