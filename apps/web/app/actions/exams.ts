'use server'

import { createClient } from '@/lib/supabase/server'

export async function createExam(data: {
  name: string
  termId: string
  yearId: string
  classId: string | null
  maxScore: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') throw new Error('Unauthorized')

  const { data: exam, error } = await supabase
    .from('exams')
    .insert({
      school_id: profile.school_id,
      name: data.name,
      term_id: data.termId,
      year_id: data.yearId,
      class_id: data.classId,
      max_score: data.maxScore,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return exam
}

export async function deleteExam(examId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)
    .eq('school_id', profile.school_id)

  if (error) throw new Error(error.message)
}
