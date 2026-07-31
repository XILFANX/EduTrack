import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessagesLayout } from '@/components/shared/messages-layout'
import type { Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'
import { getMyClassGroups, getMessagingPolicy } from '@/app/actions/chat'

export const dynamic = 'force-dynamic'

const ROLE_ORDER: Record<string, number> = {
  admin: 0, principal: 0, headteacher: 0,
  class_teacher: 1, subject_teacher: 2,
  bursar: 3, librarian: 3, storekeeper: 3, transport_matron: 3,
  parent: 4,
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', principal: 'Principal', headteacher: 'Headteacher',
  class_teacher: 'Class Teacher', subject_teacher: 'Subject Teacher',
  bursar: 'Bursar', librarian: 'Librarian', storekeeper: 'Storekeeper',
  transport_matron: 'Transport Matron', parent: 'Parent',
}

export default async function TeacherMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/dashboard')
  const isTeacher = profile.role === 'class_teacher' || profile.role === 'subject_teacher'
  if (!isTeacher) redirect('/dashboard')

  const adminClient = createAdminClient()

  // Fetch messaging policy and class groups in parallel
  const [policy, classGroups] = await Promise.all([
    getMessagingPolicy(),
    getMyClassGroups()
  ])

  // Fetch all staff in the school (excluding self)
  const { data: staffData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id)
    .neq('role', 'parent')

  // Find students in teacher's class, then get their parents
  let audienceOptions: { value: string; label: string }[] = []
  let parentsWithStudents: any[] = []

  if (profile.role === 'class_teacher') {
    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('class_teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .single()

    if (cls) {
      audienceOptions.push({ value: `class_${cls.id}`, label: `Parents of ${cls.name}` })

      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('class_id', cls.id)

      const studentIds = (students || []).map((s: any) => s.id)

      if (studentIds.length > 0) {
        const { data: links } = await adminClient
          .from('student_parents' as any)
          .select('parent_id, student_id')
          .in('student_id', studentIds)

        const parentIds = [...new Set(((links as any[]) || []).map((l: any) => l.parent_id))]

        if (parentIds.length > 0) {
          const { data: parents } = await adminClient
            .from('users')
            .select('id, full_name, salutation, role, last_seen_at')
            .in('id', parentIds)

          // Build parent → student label map
          const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]))
          const parentStudentMap: Record<string, string[]> = {}
          ;((links as any[]) || []).forEach((l: any) => {
            if (!parentStudentMap[l.parent_id]) parentStudentMap[l.parent_id] = []
            const s = studentMap[l.student_id]
            if (s) parentStudentMap[l.parent_id].push(`${s.first_name} ${s.last_name}`)
          })

          parentsWithStudents = (parents || []).map((p: any) => ({
            ...p,
            studentNames: parentStudentMap[p.id] || [],
            classIds: [cls.id]
          }))
        }
      }
    }
  } else {
    // Subject teacher: get parents of students in assigned classes
    const { data: assignments } = await supabase
      .from('class_subjects')
      .select('class_id, classes(name)')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)

    const classIds = [...new Set(((assignments as any[]) || []).map((a: any) => a.class_id))]

    if (classIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, class_id')
        .in('class_id', classIds)

      const studentIds = (students || []).map((s: any) => s.id)

      if (studentIds.length > 0) {
        const { data: links } = await adminClient
          .from('student_parents' as any)
          .select('parent_id, student_id')
          .in('student_id', studentIds)

        const parentIds = [...new Set(((links as any[]) || []).map((l: any) => l.parent_id))]

        if (parentIds.length > 0) {
          const { data: parents } = await adminClient
            .from('users')
            .select('id, full_name, salutation, role, last_seen_at')
            .in('id', parentIds)

          const studentMap = Object.fromEntries((students || []).map((s: any) => [s.id, s]))
          const parentStudentMap: Record<string, string[]> = {}
          ;((links as any[]) || []).forEach((l: any) => {
            if (!parentStudentMap[l.parent_id]) parentStudentMap[l.parent_id] = []
            const s = studentMap[l.student_id]
            if (s) parentStudentMap[l.parent_id].push(`${s.first_name} ${s.last_name}`)
          })

          parentsWithStudents = (parents || []).map((p: any) => ({
            ...p,
            studentNames: parentStudentMap[p.id] || [],
          }))
        }
      }
    }
  }

  // For subject teachers: respect policy on whether they can see/message parents
  // If policy disallows it, clear parentsWithStudents
  if (profile.role === 'subject_teacher' && policy && !policy.subject_teachers_can_message_parents) {
    parentsWithStudents = []
  }

  // Build sorted contacts: staff first (by role order), then parents
  const staffContacts = (staffData || []).map((u: any) => ({
    id: u.id,
    name: u.salutation ? `${u.salutation} ${u.full_name}` : (u.full_name || 'Staff'),
    role: ROLE_LABEL[u.role] || u.role,
    roleOrder: ROLE_ORDER[u.role] ?? 5,
    last_seen_at: u.last_seen_at,
    subtitle: undefined as string | undefined,
  }))

  const parentContacts = parentsWithStudents.map((p: any) => ({
    id: p.id,
    name: p.salutation ? `${p.salutation} ${p.full_name}` : (p.full_name || 'Parent'),
    role: 'Parent',
    roleOrder: 4,
    last_seen_at: p.last_seen_at,
    subtitle: p.studentNames.length > 0 ? `Parent of: ${p.studentNames.join(', ')}` : undefined,
  }))

  const contacts = [...staffContacts, ...parentContacts].sort((a, b) => a.roleOrder - b.roleOrder)

  // Announcements
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .eq('school_id', profile.school_id)
    .in('target_audience', ['all_users', 'all_staff', 'teaching_staff', ...audienceOptions.map(o => o.value)])
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <MessagesLayout
      currentUser={{ id: user.id, role: profile.role }}
      contacts={contacts}
      classes={profile.role === 'class_teacher' && audienceOptions.length > 0 ? [{ id: audienceOptions[0].value.split('_')[1], name: audienceOptions[0].label.replace('Parents of ', '') }] : []}
      classGroups={classGroups}
      initialContactId={undefined}
      announcements={(announcementsData as Announcement[]) || []}
      audienceOptions={audienceOptions}
      subjectPlaceholder="e.g. School Closure Tomorrow"
      directoryCategories={[
        { id: 'admin', label: 'School Admin', iconName: 'shield', roles: ['Admin', 'Principal', 'Headteacher', 'Platform Admin'] },
        { id: 'teaching', label: 'Teaching Staff', iconName: 'graduation-cap', roles: ['Class Teacher', 'Subject Teacher'] },
        { id: 'non_teaching', label: 'Non-Teaching Staff', iconName: 'briefcase', roles: ['Bursar', 'Librarian', 'Storekeeper', 'Transport Matron'] },
        { id: 'parents', label: 'Parents', iconName: 'users', roles: ['Parent'] },
      ]}
    />
  )
}
