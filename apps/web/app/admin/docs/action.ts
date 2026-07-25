"use server"

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hashPin, verifyPin } from '@/lib/crypto'

const DEV_DOCS_COOKIE = 'dev_docs_session'
const SESSION_TTL_SECONDS = 60 * 60 * 2 // 2 hours

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/admin/docs',
  }
}

/**
 * Helper: get a Supabase client that can bypass RLS for writes.
 * Falls back to the regular authenticated client if the service role key
 * is not configured.
 */
async function getWriteClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    const { createServerClient } = await import('@supabase/ssr')
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { cookies: { getAll: () => [], setAll: () => {} } }
    )
  }
  return createClient()
}

/**
 * Called on first-time PIN setup.
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
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const hash = await hashPin(pin)
  const client = await getWriteClient()

  const { error: updateError } = await (client.from('users') as any)
    .update({ dev_docs_pin_hash: hash })
    .eq('id', user.id)

  if (updateError) {
    console.error('[setupDevPin] update error:', updateError)
    return { success: false, error: 'Failed to save PIN. Please try again.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEV_DOCS_COOKIE, 'unlocked', sessionCookieOptions())

  return { success: true }
}

/**
 * Called on every subsequent login.
 */
export async function verifyDevPin(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const pin = formData.get('pin') as string
  if (!pin) {
    return { success: false, error: 'PIN is required.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Use write client to read pin hash (may be behind RLS)
  const client = await getWriteClient()
  const { data: userRecord, error: recordError } = await (client
    .from('users') as any)
    .select('dev_docs_pin_hash')
    .eq('id', user.id)
    .single() as { data: { dev_docs_pin_hash: string | null } | null; error: unknown }

  if (recordError || !userRecord?.dev_docs_pin_hash) {
    return { success: false, error: 'No PIN is set up for this account.' }
  }

  const isValid = await verifyPin(pin, userRecord.dev_docs_pin_hash)
  if (!isValid) {
    return { success: false, error: 'Incorrect PIN. Try again.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEV_DOCS_COOKIE, 'unlocked', sessionCookieOptions())

  return { success: true }
}

export async function lockDevDocs(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(DEV_DOCS_COOKIE)
}
