'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodInput {
  school_id: string
  name: string
  start_time: string
  end_time: string
  is_break?: boolean
  sort_order?: number
}

export interface SlotInput {
  school_id: string
  class_id: string
  period_id: string
  day_of_week: number // 1–5
  subject_id?: string | null
  teacher_id?: string | null
  year_id?: string | null
  term_id?: string | null
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', user: null, profile: null, supabase }

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  const role = ((profile as any)?.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!isAdmin || !(profile as any)?.school_id) return { error: 'Unauthorized', user: null, profile: null, supabase }

  return { error: null, user, profile: profile as any, supabase }
}

// ─── Period Management (Admin only) ─────────────────────────────────────────

export async function createPeriod(data: PeriodInput) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('timetable_periods' as any).insert(data)
  if (error) return { error: 'Failed to create period.' }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function updatePeriod(id: string, data: Partial<PeriodInput>) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('timetable_periods' as any).update(data).eq('id', id)
  if (error) return { error: 'Failed to update period.' }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function deletePeriod(id: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('timetable_periods' as any).delete().eq('id', id)
  if (error) return { error: 'Failed to delete period.' }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function reorderPeriods(orderedIds: string[]) {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  await Promise.all(
    orderedIds.map((id, idx) =>
      admin.from('timetable_periods' as any).update({ sort_order: idx }).eq('id', id)
    )
  )
  revalidatePath('/dashboard/timetable')
  return { success: true }
}

// ─── Slot Management (Admin only) ─────────────────────────────────────────────

export async function upsertSlot(data: SlotInput) {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('timetable_slots' as any)
    .upsert(
      {
        school_id: data.school_id,
        class_id: data.class_id,
        period_id: data.period_id,
        day_of_week: data.day_of_week,
        subject_id: data.subject_id || null,
        teacher_id: data.teacher_id || null,
        year_id: data.year_id || null,
        term_id: data.term_id || null,
        is_published: false,
      },
      { onConflict: 'class_id,period_id,day_of_week' }
    )

  if (error) {
    console.error('upsertSlot:', error)
    return { error: 'Failed to save slot.' }
  }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function clearSlot(classId: string, periodId: string, dayOfWeek: number) {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { error } = await supabase
    .from('timetable_slots' as any)
    .delete()
    .eq('class_id', classId)
    .eq('period_id', periodId)
    .eq('day_of_week', dayOfWeek)

  if (error) return { error: 'Failed to clear slot.' }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

// ─── Conflict Detection ───────────────────────────────────────────────────────

/** Returns any slots where teacher_id appears more than once in the same (day, period) */
export async function detectTeacherConflicts(schoolId: string, termId?: string) {
  const admin = createAdminClient()
  let query = admin
    .from('timetable_slots' as any)
    .select('teacher_id, period_id, day_of_week, class_id, classes(name), timetable_periods(name), users(full_name)')
    .eq('school_id', schoolId)
    .not('teacher_id', 'is', null)

  if (termId) query = query.eq('term_id', termId)

  const { data } = await query
  const slots = (data || []) as any[]

  // Group by teacher + day + period
  const map: Record<string, any[]> = {}
  for (const s of slots) {
    const key = `${s.teacher_id}::${s.day_of_week}::${s.period_id}`
    if (!map[key]) map[key] = []
    map[key].push(s)
  }

  return Object.values(map).filter(group => group.length > 1)
}

// ─── Publish/Unpublish ────────────────────────────────────────────────────────

export async function publishTimetable(schoolId: string, termId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('timetable_slots' as any)
    .update({ is_published: true })
    .eq('school_id', schoolId)
    .eq('term_id', termId)

  if (error) return { error: 'Failed to publish timetable.' }

  revalidatePath('/dashboard/timetable')
  revalidatePath('/teacher/timetable')
  revalidatePath('/parent/timetable')
  return { success: true }
}

export async function unpublishTimetable(schoolId: string, termId: string) {
  const { error: authError } = await requireAdmin()
  if (authError) return { error: authError }

  const admin = createAdminClient()
  const { error } = await admin
    .from('timetable_slots' as any)
    .update({ is_published: false })
    .eq('school_id', schoolId)
    .eq('term_id', termId)

  if (error) return { error: 'Failed to unpublish timetable.' }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPeriodsForSchool(schoolId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('timetable_periods' as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('sort_order')
    .order('start_time')
  return (data || []) as any[]
}

export async function getTimetableForClass(classId: string, termId?: string) {
  const admin = createAdminClient()
  let query = admin
    .from('timetable_slots' as any)
    .select('id, class_id, period_id, day_of_week, subject_id, teacher_id, term_id, year_id, is_published, subjects(name), users(full_name)')
    .eq('class_id', classId)

  if (termId) query = query.eq('term_id', termId)
  const { data } = await query
  return (data || []) as any[]
}

export async function getTimetableForTeacher(teacherId: string, termId?: string) {
  const admin = createAdminClient()
  let query = admin
    .from('timetable_slots' as any)
    .select('id, class_id, period_id, day_of_week, subject_id, teacher_id, is_published, subjects(name), classes(name), timetable_periods(name, start_time, end_time)')
    .eq('teacher_id', teacherId)
    .eq('is_published', true)

  if (termId) query = query.eq('term_id', termId)
  const { data } = await query
  return (data || []) as any[]
}
