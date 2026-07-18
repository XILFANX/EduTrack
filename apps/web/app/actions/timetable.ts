'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodInput {
  school_id: string
  name: string
  start_time: string   // "HH:MM" 24h
  end_time: string
  is_break?: boolean
  sort_order?: number
}

export interface SlotInput {
  school_id: string
  class_id: string
  period_id: string
  day_of_week: number   // 1-5
  subject_id?: string | null
}

// ─── Period management ────────────────────────────────────────────────────────

export async function createPeriod(data: PeriodInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }

  const { error } = await supabase.from('timetable_periods' as any).insert(data)
  if (error) {
    console.error('createPeriod:', error)
    return { error: 'Failed to create period.' }
  }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function updatePeriod(id: string, data: Partial<PeriodInput>) {
  const supabase = await createClient()
  const { error } = await supabase.from('timetable_periods' as any).update(data).eq('id', id)
  if (error) return { error: 'Failed to update period.' }
  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function deletePeriod(id: string) {
  const supabase = await createClient()
  // Slots are cascade-deleted by FK
  const { error } = await supabase.from('timetable_periods' as any).delete().eq('id', id)
  if (error) return { error: 'Failed to delete period.' }
  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function reorderPeriods(orderedIds: string[]) {
  const admin = createAdminClient()
  const updates = orderedIds.map((id, idx) =>
    admin.from('timetable_periods' as any).update({ sort_order: idx }).eq('id', id)
  )
  await Promise.all(updates)
  revalidatePath('/dashboard/timetable')
  return { success: true }
}

// ─── Slot management ─────────────────────────────────────────────────────────

export async function upsertSlot(data: SlotInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }

  const { error } = await supabase
    .from('timetable_slots' as any)
    .upsert({
      school_id: data.school_id,
      class_id: data.class_id,
      period_id: data.period_id,
      day_of_week: data.day_of_week,
      subject_id: data.subject_id || null,
    }, { onConflict: 'class_id,period_id,day_of_week' })

  if (error) {
    console.error('upsertSlot:', error)
    return { error: 'Failed to save slot.' }
  }

  revalidatePath('/dashboard/timetable')
  return { success: true }
}

export async function clearSlot(classId: string, periodId: string, dayOfWeek: number) {
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

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPeriodsForSchool(schoolId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('timetable_periods' as any)
    .select('*')
    .eq('school_id', schoolId)
    .order('sort_order')
    .order('start_time')

  if (error) return []
  return (data || []) as any[]
}

export async function getTimetableForClass(classId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('timetable_slots' as any)
    .select('id, class_id, period_id, day_of_week, subject_id, subjects(name)')
    .eq('class_id', classId)

  if (error) return []
  return (data || []) as any[]
}
