'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomUUID } from 'crypto'
import { revalidatePath } from 'next/cache'

export interface InviteParentData {
  fullName: string
  phoneNumber: string
  salutation: string
  studentId: string
  schoolId: string
}

export async function inviteParent(data: InviteParentData) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: 'Not authenticated.' }

    const admin = createAdminClient()

    // Generate unique token
    const token = randomUUID()

    // Insert into invitations table
    const { error: invErr } = await admin.from('invitations').insert({
      school_id: data.schoolId,
      role: 'parent',
      token,
      target_name: data.fullName,
      target_phone: data.phoneNumber,
      target_entity_id: data.studentId, // Links parent to student
      target_salutation: data.salutation || null,
      created_by: user.id,
    } as any)

    if (invErr) {
      console.error('Invitation insert error:', invErr)
      return { error: 'Failed to generate invite link.' }
    }

    revalidatePath('/teacher/students')
    return { token }
  } catch (err: any) {
    return { error: err.message || 'An unexpected error occurred.' }
  }
}

export async function deleteParentInviteAndAccount(inviteId: string) {
  const admin = createAdminClient()
  
  const { data: invite, error: invErr } = await admin
    .from('invitations')
    .select('token, used_at')
    .eq('id', inviteId)
    .single()
    
  if (invErr || !invite) return { error: 'Invite not found.' }
  
  const { error: delInvErr } = await admin
    .from('invitations')
    .delete()
    .eq('id', inviteId)
    
  if (delInvErr) return { error: 'Could not delete invitation.' }
  
  if (invite.used_at) {
    const syntheticEmail = `${invite.token}@invite.edutrack.app`
    const { data: usersData } = await admin.auth.admin.listUsers()
    const existingUser = usersData?.users?.find(u => u.email === syntheticEmail)
    
    if (existingUser) {
      // 1. Unlink parent from student_parents table (should cascade but we can be explicit)
      await admin.from('student_parents').delete().eq('parent_id', existingUser.id)
      
      // 2. Hard-delete user profile
      await admin.from('users').delete().eq('id', existingUser.id)
      
      // 3. Hard-delete auth account
      await admin.auth.admin.deleteUser(existingUser.id)
    }
  }
  
  revalidatePath('/teacher/students')
  return { success: true }
}
