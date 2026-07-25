'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

const SUPA_ADMIN_EMAIL = 'plancknetworks@gmail.com'

export async function addSubAdmin(data: {
  fullName: string
  email: string
  phoneNumber: string
}) {
  const email = data.email?.trim().toLowerCase()
  if (!email) return { error: 'Email is required' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Strictly enforce Supa Admin email
  if (user.email !== SUPA_ADMIN_EMAIL) {
    return { error: 'Only the Supa Admin can add new admins.' }
  }

  if (email === SUPA_ADMIN_EMAIL) {
    return { error: 'This email is reserved for the Supa Admin.' }
  }

  const adminClient = createAdminClient()
  const { data: usersPage, error: listError } = await adminClient.auth.admin.listUsers()
  if (listError) return { error: 'Could not look up users.' }

  const targetUser = usersPage.users.find(u => u.email?.toLowerCase() === email)
  let targetUserId = targetUser?.id

  if (targetUser) {
    // Check if they have an account as school
    const { data: profile } = await adminClient.from('users').select('role').eq('id', targetUser.id).single()
    if (profile && profile.role === 'school') {
      return { error: 'This user already has a School account. Admins cannot be schools.' }
    }
  } else {
    // Invite them
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { role: 'admin' }
    })
    
    if (inviteError || !inviteData.user) {
      return { error: 'Failed to invite user: ' + inviteError?.message }
    }
    targetUserId = inviteData.user.id
  }

  if (!targetUserId) return { error: 'Failed to resolve user ID.' }

  // Upsert into users table
  const { error: userError } = await adminClient.from('users').upsert({
    id: targetUserId,
    full_name: data.fullName,
    email: email,
    phone_number: data.phoneNumber,
    role: 'admin',
  }, { onConflict: 'id' })

  if (userError) {
    return { error: 'Failed to update user record: ' + userError.message }
  }

  revalidatePath('/admin/admins')
  return { success: true }
}

export async function removeSubAdmin(adminId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  if (user.email !== SUPA_ADMIN_EMAIL) {
    return { error: 'Only the Supa Admin can remove admins.' }
  }

  if (adminId === user.id) return { error: 'You cannot remove yourself.' }

  const adminClient = createAdminClient()
  
  // Protect Supa Admin record from deletion just in case
  const { data: adminRecord } = await adminClient.from('users').select('email').eq('id', adminId).single()
  if (adminRecord && adminRecord.email === SUPA_ADMIN_EMAIL) {
    return { error: 'Supa Admin cannot be removed.' }
  }

  // Demote to something harmless, we set them to 'student' or 'teacher' without school? 
  // Let's just delete them from the public.users table or demote to 'none' / null role.
  // Actually, we can delete the row from users, or set role to 'user' or 'deleted'.
  // Since they are an admin, let's delete them from public.users and let auth remain. 
  // Wait, if they login, they won't have a users row. We can set role to 'teacher' with no school.
  // We will just change role to 'teacher'.
  await adminClient.from('users').update({ role: 'teacher', school_id: null }).eq('id', adminId)

  revalidatePath('/admin/admins')
  return { success: true }
}
