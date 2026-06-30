'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface OnboardingData {
  schoolName: string
  schoolPhone: string
  schoolAddress: string
  curriculumType: 'cbc' | '844' | 'igcse' | 'other'
  subscriptionPlan: string
  feeDueDay: number
  adminTitle: 'principal' | 'headteacher'
}

export async function completeOnboarding(
  data: OnboardingData
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated. Please log in again.' }

    const admin = createAdminClient()

    // 1. Create the school record
    const slug =
      data.schoolName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) +
      '-' +
      Math.random().toString(36).slice(2, 7)

    const { data: schoolResult, error: schoolError } = await admin
      .from('schools')
      .insert({
        name: data.schoolName,
        domain: slug,
        subscription_tier: data.subscriptionPlan,
      })
      .select('id')
      .single()

    const school = schoolResult as any

    if (schoolError || !school) {
      return { error: `Failed to create school: ${schoolError?.message ?? 'Unknown error'}` }
    }

    // 2. Upsert the user profile — works whether the row already exists or not
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

    // 3. Verify the write actually took effect before telling the client to proceed
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
  } catch (err: any) {
    return { error: err.message || 'An unexpected server error occurred.' }
  }
}
