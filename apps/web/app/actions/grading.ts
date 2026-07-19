'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface GradeScaleInput {
  school_id: string
  class_id?: string
  subject_id?: string
  grade: string
  label?: string
  min_score: number
  max_score: number
  points: number
  remarks?: string
}

export async function createGradeScale(data: GradeScaleInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }

  const { error } = await supabase.from('grade_scales').insert(data)
  if (error) {
    console.error('Create grade scale error:', error)
    // Handle Postgres unique constraint violation gracefully
    if (error.code === '23505') {
      return { error: 'A grade boundary with this symbol already exists for this exact scope.' }
    }
    return { error: 'Failed to create grade scale' }
  }

  revalidatePath('/dashboard/grading')
  return { success: true }
}

export async function updateGradeScale(id: string, data: Partial<GradeScaleInput>) {
  const supabase = await createClient()
  const { error } = await supabase.from('grade_scales').update(data).eq('id', id)
  if (error) {
    console.error('Update grade scale error:', error)
    if (error.code === '23505') {
      return { error: 'A grade boundary with this symbol already exists for this exact scope.' }
    }
    return { error: 'Failed to update grade scale' }
  }

  revalidatePath('/dashboard/grading')
  return { success: true }
}

export async function deleteGradeScale(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('grade_scales').delete().eq('id', id)
  if (error) {
    console.error('Delete grade scale error:', error)
    return { error: 'Failed to delete grade scale' }
  }

  revalidatePath('/dashboard/grading')
  return { success: true }
}
