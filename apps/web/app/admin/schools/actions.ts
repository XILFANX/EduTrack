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

async function requireAdmin() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const ROOT_EMAIL = 'plancknetworks@gmail.com'
  const isRoot = user.email === ROOT_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'admin') {
      throw new Error('Unauthorized')
    }
  }

  return supabase
}

export async function extendTrial(schoolId: string) {
  await requireAdmin()
  const admin = await createAdminClient()

  const { data: school, error: fetchErr } = await admin
    .from('schools')
    .select('*')
    .eq('id', schoolId)
    .single()

  if (fetchErr || !school) throw new Error('School not found')

  const s = school as any
  const currentEnd = s.trial_ends_at ? new Date(s.trial_ends_at) : new Date()
  const newEnd = new Date(currentEnd.getTime() + 14 * 24 * 60 * 60 * 1000)

  const { error } = await (admin.from('schools') as any)
    .update({ trial_ends_at: newEnd.toISOString() })
    .eq('id', schoolId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/schools/${schoolId}`)
}

export async function updateSubscriptionStatus(schoolId: string, status: string) {
  await requireAdmin()
  const admin = await createAdminClient()

  const { error } = await (admin.from('schools') as any)
    .update({ subscription_status: status })
    .eq('id', schoolId)

  if (error) throw new Error(error.message)
  revalidatePath(`/admin/schools/${schoolId}`)
}
