'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSubject(schoolId: string, name: string, teacherId?: string) {
  const admin = createAdminClient()

  // Validate subject doesn't already exist for this school
  const { data: existing } = await admin
    .from('subjects')
    .select('id')
    .eq('school_id', schoolId)
    .ilike('name', name.trim())
    .single()

  if (existing) {
    return { error: 'A subject with this name already exists.' }
  }

  const { data, error } = await admin
    .from('subjects')
    .insert({
      school_id: schoolId,
      name: name.trim(),
      teacher_id: teacherId || null,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  return { success: true, data }
}

export async function deleteSubject(id: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('subjects')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  return { success: true }
}
