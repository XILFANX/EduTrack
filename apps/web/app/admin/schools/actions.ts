'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSchool(data: {
  name: string
  domain?: string
  curriculumType: string
  subscriptionPlan: string
}) {
  const admin = await createAdminClient()

  const { data: newSchool, error } = await admin
    .from('schools')
    .insert({
      name: data.name,
      domain: data.domain || null,
      curriculum_type: data.curriculumType,
      subscription_tier: data.subscriptionPlan,
      fee_due_day: 5, // default
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/schools')
  revalidatePath('/admin/dashboard')
  return { success: true, schoolId: newSchool.id }
}
