'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface OnboardingData {
  schoolName: string
  schoolPhone: string
  schoolAddress: string
  curriculumType: 'cbc' | '844' | 'igcse' | 'other'
  subscriptionPlan: string
  feeDueDay: number
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

    const { data: school, error: schoolError } = await admin
      .from('schools')
      .insert({
        name: data.schoolName,
        domain: slug,
        address: data.schoolAddress,
        subscription_tier: data.subscriptionPlan,
      })
      .select()
      .single()

    if (schoolError || !school) {
      return { error: `Failed to create school: ${schoolError?.message ?? 'Unknown error'}` }
    }

    // 2. Link the principal's user profile to the new school
    const { error: profileError } = await admin
      .from('users')
      .update({
        school_id: school.id,
        role: 'principal',
        phone_number: data.schoolPhone,
      })
      .eq('id', user.id)

    if (profileError) {
      return { error: `Failed to link you to the school: ${profileError.message}` }
    }

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'An unexpected server error occurred.' }
  }
}
