'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateSchoolLogo(
  logoUrl: string
): Promise<{ success: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated.' }

    const { data: profile } = await supabase
      .from('users')
      .select('school_id')
      .eq('id', user.id)
      .single()

    if (!profile?.school_id) return { error: 'School not found.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('schools')
      .update({ logo_url: logoUrl })
      .eq('id', profile.school_id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings/school')
    revalidatePath('/dashboard')
    revalidatePath('/', 'layout')
    
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
