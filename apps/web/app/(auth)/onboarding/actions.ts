'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { computeTrialEnd } from '@/../../packages/shared/billing/engine'

export interface OnboardingData {
  schoolName: string
  schoolPhone: string
  schoolAddress: string
  curriculumType: 'cbc' | '844' | 'igcse' | 'other'
  feeDueDay: number
  adminTitle: 'principal' | 'headteacher'
  countryCode: string   // ISO 3166-1 alpha-2 — required for pricing region
  logoUrl?: string | null
}

export async function completeOnboarding(
  data: OnboardingData
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated. Please log in again.' }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any

    // 1. Create the school record — no legacy subscription_tier column
    const slug =
      data.schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) +
      '-' +
      Math.random().toString(36).slice(2, 7)

    const { data: school, error: schoolError } = await admin
      .from('schools')
      .insert({
        name: data.schoolName,
        domain: slug,
        country_code: data.countryCode,
        logo_url: data.logoUrl || null,
      })
      .select('id')
      .single()

    if (schoolError || !school) {
      return { error: `Failed to create school: ${schoolError?.message ?? 'Unknown error'}` }
    }

    // 2. Read billing_config + Band 1 from DB — trial duration must never be hardcoded.
    const [{ data: billingConfig }, { data: band }] = await Promise.all([
      admin.from('billing_config').select('trial_days_default').eq('product', 'edutrack').single(),
      admin.from('plan_bands').select('id').eq('product', 'edutrack').eq('band_index', 1).single(),
    ])

    if (!billingConfig || !band) {
      console.error('EduTrack billing config or plan bands not seeded. billingConfig:', billingConfig, 'band:', band)
      return { error: 'Billing configuration is not ready. Please contact support.' }
    }

    const trialStart = new Date()
    const trialEnd = computeTrialEnd(trialStart, billingConfig.trial_days_default)

    await admin.from('subscriptions').insert({
      account_id: school.id,
      product: 'edutrack',
      current_band_id: band.id,
      status: 'trialing',
      billing_cycle: 'termly',
      trial_starts_at: trialStart.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      current_period_start: trialStart.toISOString(),
      current_period_end: trialEnd.toISOString(),
      current_band_unit_count: 0,
    })

    // 3. Upsert the user profile
    const { error: profileError } = await admin
      .from('users')
      .upsert({
        id: user.id,
        school_id: school.id,
        role: data.adminTitle || 'principal',
        phone_number: data.schoolPhone,
        full_name: user.user_metadata?.full_name ?? user.email ?? 'Administrator',
        email: user.email,
      }, { onConflict: 'id' })

    if (profileError) {
      return { error: `Failed to save your profile: ${profileError.message}` }
    }

    // 4. Verify the write took effect before proceeding
    const { data: verified, error: verifyError } = await admin
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (verifyError || !verified?.school_id) {
      return { error: 'Profile was not saved correctly. Please try again.' }
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'An unexpected server error occurred.'
    return { error: message }
  }
}
