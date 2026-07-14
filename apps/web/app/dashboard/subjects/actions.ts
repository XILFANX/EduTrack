'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSubject(schoolId: string, name: string, teacherId?: string, classId?: string) {
  const admin = createAdminClient()

  // Check if a matching subject already exists (including soft-deleted ones)
  const allMatchQuery = admin
    .from('subjects')
    .select('*')
    .eq('school_id', schoolId)
    .ilike('name', name.trim())

  if (classId) {
    allMatchQuery.eq('class_id' as any, classId)
  } else {
    allMatchQuery.is('class_id' as any, null)
  }

  const { data: matches } = await allMatchQuery

  // If there's an active (non-deleted) subject, block it
  const activeMatch = matches?.find((s: any) => !s.deleted_at)
  if (activeMatch) {
    const scope = classId ? 'this class' : 'the unassigned list'
    return { error: `A subject named "${name.trim()}" already exists in ${scope}.` }
  }

  // If there's a soft-deleted orphan, restore it instead of creating a new one
  const orphan = matches?.find((s: any) => s.deleted_at)
  if (orphan) {
    const { data, error } = await admin
      .from('subjects')
      .update({ deleted_at: null, teacher_id: teacherId || null, class_id: classId || null } as any)
      .eq('id', orphan.id)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/dashboard/subjects')
    revalidatePath('/dashboard')
    return { success: true, data }
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
  revalidatePath('/dashboard')
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
