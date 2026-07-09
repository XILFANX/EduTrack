'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function deleteUserAccount(): Promise<{ error: string } | undefined> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { error: 'Not authenticated.' }
    }

    const admin = createAdminClient()
    
    // Soft delete the user record to preserve historical data
    const { error: dbError } = await admin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', user.id)

    if (dbError) {
      return { error: dbError.message }
    }
    
    // We don't delete from auth.users to avoid completely destroying the link for foreign keys, 
    // or we could delete the auth user if requested. Soft delete is much safer for a school DB.

    // Sign out the user
    await supabase.auth.signOut()
    
  } catch (err: any) {
    return { error: err.message || 'Unexpected error occurred.' }
  }

  // Redirect to login after successful deletion
  redirect('/login')
}

export async function updateAccountSettings(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string

    if (!fullName) return { error: 'Full name is required' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({
        full_name: fullName,
        phone_number: phone || null
      })
      .eq('id', user.id)

    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Unexpected error' }
  }
}
