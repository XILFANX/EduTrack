'use server'

import { createClient } from '@/lib/supabase/server'

interface DisciplinePayload {
  schoolId: string
  classId: string
  teacherId: string
  studentId: string
  title: string
  description: string
  actionTaken?: string
}

export async function saveDisciplineLog(payload: DisciplinePayload) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('discipline_logs')
    .insert({
      school_id: payload.schoolId,
      class_id: payload.classId,
      recorded_by: payload.teacherId,
      student_id: payload.studentId,
      title: payload.title,
      description: payload.description,
      action_taken: payload.actionTaken || null
    })

  if (error) {
    console.error('Error saving discipline log:', error)
    return { error: 'Failed to save discipline log' }
  }

  return { success: true }
}
