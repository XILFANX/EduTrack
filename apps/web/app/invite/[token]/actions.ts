'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getPortalUrl } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { sendSmsOtp } from '@/lib/notifications'

/**
 * Handles all invite-related actions (register, login, send_otp, reset_password).
 */
export async function activateInvite(formData: FormData) {
  const actionType = formData.get('actionType') as string
  const token      = formData.get('token') as string
  const inviteId   = formData.get('inviteId') as string

  const admin = createAdminClient()

  // 1. Re-fetch invite to validate
  const { data: invite } = await admin
    .from('invitations')
    .select('id, token, role, phone, name, landlord_id, property_id, used_at, reset_otp, reset_otp_expires_at')
    .eq('id', inviteId)
    .eq('token', token)
    .single()

  if (!invite) {
    return { error: 'This invite link is invalid or has been removed.' }
  }

  // 2. Handle OTP Generation & Sending
  if (actionType === 'send_otp') {
    if (!invite.phone) {
      return { error: 'No phone number is registered for this invite.' }
    }
    
    // Generate a secure 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString() // 15 mins

    const { error: updateErr } = await admin
      .from('invitations')
      .update({ reset_otp: otpCode, reset_otp_expires_at: expiresAt })
      .eq('id', invite.id)

    if (updateErr) {
      return { error: 'Failed to generate reset code. Please try again.' }
    }

    // Call our mock SMS sender
    await sendSmsOtp(invite.phone, otpCode)

    return { success: true }
  }

  // Common fields for register, login, and OTP verify
  const name       = (formData.get('name') as string || invite.name || '').trim()
  const phone      = (formData.get('phone') as string || invite.phone || '').trim()
  const password   = formData.get('password') as string
  
  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // 3. Phone security gate — validate if landlord registered a phone (for registration)
  if (actionType === 'register' && invite.phone) {
    const normalize = (p: string) => p.replace(/[\s\-\(\)]/g, '').replace(/^0/, '+254')
    if (normalize(phone) !== normalize(invite.phone)) {
      return { error: 'That phone number does not match our records. Please contact your property manager.' }
    }
  }

  // 4. Synthetic email (invisible to user — just the auth mechanism)
  const syntheticEmail = `${token}@invite.estatetrack.app`
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

    // Success -> redirect
    const portalUrl = getPortalUrl(invite.role, true)
    redirect(portalUrl)
  }

  // 6. Handle Reset Password via OTP
  if (actionType === 'otp') {
    const userOtp = formData.get('otp') as string
    
    if (!invite.reset_otp || !invite.reset_otp_expires_at) {
      return { error: 'No active password reset request found.' }
    }

    if (new Date(invite.reset_otp_expires_at) < new Date()) {
      return { error: 'The OTP has expired. Please request a new one.' }
    }

    if (invite.reset_otp !== userOtp) {
      return { error: 'Incorrect OTP. Please check the code and try again.' }
    }

    // Locate the Auth user
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
    await admin.from('invitations').update({ reset_otp: null, reset_otp_expires_at: null }).eq('id', invite.id)

    // Sign them in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInErr) {
      return { error: 'Password updated, but sign-in failed. Please visit /login.' }
    }

    // Redirect
    const portalUrl = getPortalUrl(invite.role, true)
    redirect(portalUrl)
  }

  // 7. Handle First-Time Registration
  if (actionType === 'register') {
    // Double check it wasn't already used
    if (invite.used_at) {
      return { error: 'This invite has already been used. Please log in.' }
    }

    // Create the auth user
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

    // Upsert profile
    await admin.from('profiles').upsert({
      id: userId,
      role: invite.role,
      landlord_id: invite.landlord_id,
      full_name: name,
      phone,
    }, { onConflict: 'id' })

    // Link records
    if (invite.role === 'tenant') {
      await admin
        .from('tenants')
        .update({ profile_id: userId })
        .eq('landlord_id', invite.landlord_id)
        .is('profile_id', null)
        .eq('full_name', name) // best-effort match
    } else if (invite.role === 'caretaker' && invite.property_id) {
      await admin
        .from('properties')
        .update({ caretaker_id: userId })
        .eq('id', invite.property_id)
        .eq('landlord_id', invite.landlord_id)
    }

    // Mark invite as used
    await admin
      .from('invitations')
      .update({ used_at: new Date().toISOString(), name })
      .eq('id', invite.id)

    // Sign in
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: syntheticEmail,
      password,
    })

    if (signInErr) {
      return { error: 'Account created but could not sign you in. Please visit /login.' }
    }

    // Redirect
    const portalUrl = getPortalUrl(invite.role, true)
    redirect(portalUrl)
  }

  return { error: 'Invalid action type.' }
}
