'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSubject(schoolId: string, name: string, teacherId?: string, classId?: string) {
  const admin = createAdminClient()

  // Uniqueness is per class (or per school if no class) — same name CAN exist in different classes
  const duplicateQuery = admin
    .from('subjects')
    .select('id')
    .eq('school_id', schoolId)
    .ilike('name', name.trim())
    .is('deleted_at', null)

  if (classId) {
    duplicateQuery.eq('class_id' as any, classId)
  } else {
    duplicateQuery.is('class_id' as any, null)
  }

  const { data: existing } = await duplicateQuery.maybeSingle()

  if (existing) {
    const scope = classId ? 'this class' : 'the unassigned list'
    return { error: `A subject named "${name.trim()}" already exists in ${scope}.` }
  }


  const { data, error } = await admin
    .from('subjects')
    .insert({
      school_id: schoolId,
      name: name.trim(),
      teacher_id: teacherId || null,
      class_id: classId || null,
    } as any)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  return { success: true, data }
}

export async function assignSubjectTeacher(subjectId: string, teacherId: string | null) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('subjects')
    .update({ teacher_id: teacherId })
    .eq('id', subjectId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/subjects')
  return { success: true }
}

export async function deleteSubject(id: string) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('subjects')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/subjects')
  return { success: true }
}
