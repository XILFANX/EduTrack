import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { MessagesPageClient } from './messages-page-client'
import type { Announcement } from '@/components/shared/announcements-feed'

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

export default async function PrincipalMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ contactId?: string }>
}) {
  const resolvedParams = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name, salutation')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['admin', 'principal', 'headteacher'].includes(profile.role as string)) redirect('/dashboard')

  const adminClient = createAdminClient()

  // 1. Fetch Staff contacts
  const { data: staffData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id)
    .neq('role', 'parent')

  // 2. Fetch Parent contacts with linked students & class mapping
  const { data: parentsData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .eq('role', 'parent')

  const { data: classesData } = await supabase
    .from('classes')
    .select('id, name')
    .eq('school_id', profile.school_id)
    .order('name')

  let parentsWithStudents: any[] = []
  if (parentsData && parentsData.length > 0) {
    const parentIds = parentsData.map(p => p.id)
    const { data: links } = await adminClient
      .from('student_parents' as any)
      .select('parent_id, student_id, students(first_name, last_name, student_classes(class_id))')
      .in('parent_id', parentIds)

    const parentStudentMap: Record<string, string[]> = {}
    const parentClassMap: Record<string, Set<string>> = {}
    ;((links as any[]) || []).forEach((l: any) => {
      if (!parentStudentMap[l.parent_id]) parentStudentMap[l.parent_id] = []
      if (!parentClassMap[l.parent_id]) parentClassMap[l.parent_id] = new Set()
      if (l.students) {
        parentStudentMap[l.parent_id].push(`${l.students.first_name} ${l.students.last_name}`)
        if (l.students.student_classes?.length > 0) {
          l.students.student_classes.forEach((sc: any) => parentClassMap[l.parent_id].add(sc.class_id))
        }
      }
    })

    parentsWithStudents = parentsData.map((p: any) => ({
      ...p,
      studentNames: parentStudentMap[p.id] || [],
      classIds: Array.from(parentClassMap[p.id] || []),
    }))
  }

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
    classIds: p.classIds,
  }))

  const contacts = [...staffContacts, ...parentContacts].sort((a, b) => a.roleOrder - b.roleOrder)

  // 3. Fetch Announcements
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(20)

  const audienceOptions = [
    { value: 'all_users', label: 'All Users (Staff & Parents)' },
    { value: 'all_staff', label: 'All Staff' },
    { value: 'all_parents', label: 'All Parents' },
    { value: 'teaching_staff', label: 'Teaching Staff' },
    { value: 'non_teaching_staff', label: 'Non-Teaching Staff' },
    { value: 'bursars', label: 'Bursars' },
    { value: 'transport_matrons', label: 'Transport Matrons' },
    { value: 'librarians', label: 'Librarians' },
  ]

  return (
    <MessagesPageClient
      currentUser={{ id: user.id, role: profile.role as string }}
      contacts={contacts}
      classes={(classesData as any[]) || []}
      initialContactId={resolvedParams.contactId}
      announcements={(announcementsData as Announcement[]) || []}
      audienceOptions={audienceOptions}
    />
  )
}
