'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_ROLES = ['admin', 'principal', 'headteacher']

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', supabase, profile: null }

  const { data: profile } = await supabase
    .from('users').select('school_id, role').eq('id', user.id).single()

  const p = profile as any
  if (!p?.school_id || !ADMIN_ROLES.some(r => p.role?.includes(r))) {
    return { error: 'Unauthorized', supabase, profile: null }
  }
  return { error: null, supabase, profile: p }
}

// ─── Grade Scales ─────────────────────────────────────────────────────────────

export interface GradeScaleInput {
  school_id: string
  grade: string          // e.g. "A", "B+", "C"
  label?: string         // e.g. "Excellent", "Good"
  min_score: number
  max_score: number
  points: number         // GPA points
  remarks?: string
}

export async function createGradeScale(data: GradeScaleInput) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('grade_scales').insert(data)
  if (error) {
    if (error.code === '23505') return { error: 'A grade with this symbol already exists.' }
    return { error: 'Failed to create grade scale.' }
  }
  revalidatePath('/dashboard/grading')
  return { success: true }
}

export async function updateGradeScale(id: string, data: Partial<GradeScaleInput>) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('grade_scales').update(data).eq('id', id)
  if (error) {
    if (error.code === '23505') return { error: 'A grade with this symbol already exists.' }
    return { error: 'Failed to update grade scale.' }
  }
  revalidatePath('/dashboard/grading')
  return { success: true }
}

export async function deleteGradeScale(id: string) {
  const { error: authError, supabase } = await requireAdmin()
  if (authError) return { error: authError }

  const { error } = await supabase.from('grade_scales').delete().eq('id', id)
  if (error) return { error: 'Failed to delete grade scale.' }
  revalidatePath('/dashboard/grading')
  return { success: true }
}

