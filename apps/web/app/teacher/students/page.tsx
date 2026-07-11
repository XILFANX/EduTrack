import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TeacherStudentsClient } from './teacher-students-client'

export const dynamic = 'force-dynamic'

export default async function TeacherStudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null
  
  if (profile.role !== 'class_teacher' && profile.role !== 'principal') {
    // Other staff shouldn't manage parent invites directly, but maybe we show a read-only list?
    // For now we just return an empty state if they're not a class teacher.
    // The prompt says "The class teacher is responsible for inviting parents".
    return (
      <div className="flex items-center justify-center h-full text-center py-20 px-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Class Teachers Only</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Only designated Class Teachers can manage their students' parent invitations.
          </p>
        </div>
      </div>
    )
  }

  // 1. Fetch the class assigned to this teacher
  const { data: cls } = await supabase
    .from('classes')
    .select('id, name')
    .eq('class_teacher_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!cls) {
    return (
      <div className="flex items-center justify-center h-full text-center py-20 px-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">No Class Assigned</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            You have not been assigned as a class teacher. Please contact your school administrator.
          </p>
        </div>
      </div>
    )
  }

  // 2. Fetch students in this class
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', cls.id)
    .is('deleted_at', null)
    .order('first_name')
    
  const studentIds = (students || []).map(s => s.id)

  // 3. Fetch parent invitations for these students
  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('role', 'parent')
    .in('target_entity_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])
    
  // 4. Fetch linked parents for these students
  const { data: parentLinks } = await supabase
    .from('student_parents' as any)
    .select('parent_id, student_id, users(id, full_name, phone_number)')
    .in('student_id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000'])

  return (
    <TeacherStudentsClient 
      students={students || []} 
      invitations={invitations || []} 
      parentLinks={(parentLinks as any) || []} 
      schoolId={profile.school_id}
      className={cls.name}
    />
  )
}
