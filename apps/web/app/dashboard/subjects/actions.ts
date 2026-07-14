'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createSubject(schoolId: string, name: string, classIds: string[]) {
  const admin = createAdminClient()

  // 1. Check if a global subject with this name already exists
  let subjectId: string;
  const { data: existing } = await admin
    .from('subjects')
    .select('id')
    .eq('school_id', schoolId)
    .ilike('name', name.trim())
    .limit(1)
    .maybeSingle()

  if (existing) {
    subjectId = existing.id;
  } else {
    // 2. Create the global subject
    const { data: newSub, error: subErr } = await admin
      .from('subjects')
      .insert({
        school_id: schoolId,
        name: name.trim()
      } as any)
      .select('id')
      .single()
    
    if (subErr || !newSub) return { error: subErr?.message || 'Failed to create subject' }
    subjectId = newSub.id;
  }

  // 3. Map to selected classes
  if (classIds && classIds.length > 0) {
    const mappings = classIds.map(cid => ({
      school_id: schoolId,
      class_id: cid,
      subject_id: subjectId,
    }));
    // Use upsert to avoid duplicate key errors if the mapping already exists
    const { error: mapErr } = await admin
      .from('class_subjects')
      .upsert(mappings, { onConflict: 'class_id, subject_id' } as any)
    
    if (mapErr) return { error: mapErr.message }
  }

  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function assignSubjectTeacher(classSubjectId: string, teacherId: string | null) {
  const admin = createAdminClient()

  const { error } = await admin
    .from('class_subjects')
    .update({ teacher_id: teacherId })
    .eq('id', classSubjectId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/subjects')
  return { success: true }
}

export async function removeSubjectFromClass(classSubjectId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('class_subjects')
    .delete()
    .eq('id', classSubjectId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/subjects')
  return { success: true }
}

export async function deleteGlobalSubject(subjectId: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('subjects')
    .delete()
    .eq('id', subjectId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/subjects')
  revalidatePath('/dashboard')
  return { success: true }
}
