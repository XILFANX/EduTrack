"use server"

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hashPin, verifyPin } from '@/lib/crypto'

// Cookie name for the developer docs session
const DEV_DOCS_COOKIE = 'dev_docs_session'

// 2-hour session for the unlocked state
const SESSION_TTL_SECONDS = 60 * 60 * 2

/**
 * Called on first-time PIN setup.
 * Validates that `pin` matches `confirmPin`, then hashes and persists it.
 */
export async function setupDevPin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const pin = formData.get('pin') as string
  const confirmPin = formData.get('confirmPin') as string

  if (!pin || pin.length < 4) {
    return { success: false, error: 'PIN must be at least 4 characters.' }
  }

  if (pin !== confirmPin) {
    return { success: false, error: 'PINs do not match. Please try again.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Hash with scrypt before storing — PIN itself never touches the DB
  const hash = await hashPin(pin)

  const { error: updateError } = await (supabase
    .from('users') as any)
    .update({ dev_docs_pin_hash: hash })
    .eq('id', user.id)

  if (updateError) {
    console.error('[setupDevPin] Supabase update error:', updateError)
    return { success: false, error: 'Failed to save PIN. Please try again.' }
  }

  // Drop the session cookie immediately after setup
  const cookieStore = await cookies()
  cookieStore.set(DEV_DOCS_COOKIE, 'unlocked', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/admin/docs',
  })

  return { success: true }
}

/**
 * Called on every subsequent login.
 * Fetches the stored hash from DB and does a constant-time comparison.
 */
export async function verifyDevPin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const pin = formData.get('pin') as string

  if (!pin) {
    return { success: false, error: 'PIN is required.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const { data: profile, error: profileError } = await (supabase
    .from('users') as any)
    .select('dev_docs_pin_hash')
    .eq('id', user.id)
    .single() as { data: { dev_docs_pin_hash: string | null } | null, error: unknown }

  if (profileError || !profile?.dev_docs_pin_hash) {
    return { success: false, error: 'No PIN is set up for this account.' }
  }

  // Constant-time comparison via scrypt — no short-circuit possible
  const isValid = await verifyPin(pin, profile.dev_docs_pin_hash)

  if (!isValid) {
    return { success: false, error: 'Incorrect PIN. Try again.' }
  }

  // Valid — grant access via secure, HTTP-only session cookie
  const cookieStore = await cookies()
  cookieStore.set(DEV_DOCS_COOKIE, 'unlocked', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS,
    path: '/admin/docs',
  })

  return { success: true }
}

/**
 * Clears the developer docs session cookie, locking the portal.
 */
export async function lockDevDocs(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEV_DOCS_COOKIE)
}
