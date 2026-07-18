'use server'

import { createClient } from '@/lib/supabase/server'
import { broadcastAnnouncement } from './chat'

export async function createAcademicYear(name: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('academic_years')
    .insert({
      school_id: profile.school_id,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: false // New years are inactive by default
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createAcademicTerm(yearId: string, name: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('academic_terms')
    .insert({
      school_id: profile.school_id,
      year_id: yearId,
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: false
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function toggleActiveSession(yearId: string, termId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') throw new Error('Unauthorized')

  // We need to perform a transaction-like operation.
  // 1. Deactivate all years and terms for this school
  await supabase
    .from('academic_years')
    .update({ is_active: false })
    .eq('school_id', profile.school_id)

  await supabase
    .from('academic_terms')
    .update({ is_active: false })
    .eq('school_id', profile.school_id)

  // 2. Activate the target Year
  const { data: activeYear, error: yearErr } = await supabase
    .from('academic_years')
    .update({ is_active: true })
    .eq('id', yearId)
    .select()
    .single()

  if (yearErr) throw new Error('Failed to activate year: ' + yearErr.message)

  let activeTermName = null

  // 3. Activate the target Term if provided
  if (termId) {
    const { data: activeTerm, error: termErr } = await supabase
      .from('academic_terms')
      .update({ is_active: true })
      .eq('id', termId)
      .select()
      .single()
      
    if (termErr) throw new Error('Failed to activate term: ' + termErr.message)
    activeTermName = activeTerm.name
  }

  // 4. Alert the staff via Announcement Broadcast
  const sessionName = activeTermName ? `${activeYear.name} - ${activeTermName}` : activeYear.name
  
  try {
    await broadcastAnnouncement(
      'System Alert: New Academic Session Active',
      `The administration has officially transitioned the active academic session to: ${sessionName}. Please ensure all your date-wise activities (grading, attendance, syllabus) reflect the new session.`,
      'all_staff'
    )
  } catch (err) {
    console.error('Failed to broadcast session alert:', err)
    // We don't throw here because the session transition itself succeeded
  }

  return { success: true }
}
