import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessagesLayout } from '@/components/shared/messages-layout'
import type { Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'
import { getMyClassGroups, getMessagingPolicy } from '@/app/actions/chat'

export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name, salutation')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'parent') redirect('/dashboard')

  const adminClient = createAdminClient()

  // Fetch policy and class groups in parallel
  const [policy, classGroups] = await Promise.all([
    getMessagingPolicy(),
    getMyClassGroups()
  ])

  // 1. Fetch Contacts
  // Parents can see: Their children's teachers (class teachers), and Admin — subject to policy.
  
  const { data: adminData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .in('role', ['admin', 'principal', 'headteacher'])

  const { data: studentLinks } = await adminClient
    .from('student_parents' as any)
    .select('student_id')
    .eq('parent_id', user.id)

  const studentIds = ((studentLinks as any[]) || []).map((sl: any) => sl.student_id)
  
  let teacherIds: string[] = []
  let classIds: string[] = []
  if (studentIds.length > 0) {
    const { data: students } = await adminClient
      .from('students')
      .select('class_id')
      .in('id', studentIds)
    
    classIds = Array.from(new Set((students || []).map(s => s.class_id).filter(Boolean))) as string[]

    if (classIds.length > 0) {
      const { data: classes } = await adminClient
        .from('classes')
        .select('class_teacher_id')
        .in('id', classIds)
      
      teacherIds = (classes || []).map(c => c.class_teacher_id).filter(Boolean) as string[]
    }
  }

  let teachersData: any[] = []
  if (teacherIds.length > 0) {
    const { data } = await adminClient
      .from('users')
      .select('id, full_name, salutation, role, last_seen_at')
      .in('id', teacherIds)
    if (data) teachersData = data
  }

  // Apply policy: filter out admin contacts if parents_can_message_admin is false
  const filteredAdminData = (policy && !policy.parents_can_message_admin) ? [] : (adminData || [])

  // Apply policy: filter out teacher contacts if parents_can_message_teachers is false
  const filteredTeachersData = (policy && !policy.parents_can_message_teachers) ? [] : teachersData

  const contacts = [
    ...filteredAdminData.map((a: any) => ({
      id: a.id,
      name: a.salutation ? `${a.salutation} ${a.full_name}` : (a.full_name || 'School Admin'),
      role: 'Admin',
      last_seen_at: a.last_seen_at,
      roleOrder: 0
    })),
    ...filteredTeachersData.map((t: any) => ({
      id: t.id,
      name: t.salutation ? `${t.salutation} ${t.full_name}` : (t.full_name || 'Class Teacher'),
      role: 'Class Teacher',
      last_seen_at: t.last_seen_at,
      roleOrder: 1
    }))
  ].sort((a, b) => a.roleOrder - b.roleOrder)

  // 2. Fetch Announcements
  // Parents see announcements targeted to: all_users, all_parents, and their specific classes
  const targetAudiences = ['all_users', 'all_parents', ...classIds.map(id => `class_${id}`)]
  
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .eq('school_id', profile.school_id)
    .in('target_audience', targetAudiences)
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <MessagesLayout
      currentUser={{ id: user.id, role: profile.role }}
      contacts={contacts}
      classes={[]}
      classGroups={classGroups}
      initialContactId={undefined}
      announcements={(announcementsData as Announcement[]) || []}
      audienceOptions={[]} // Parents cannot broadcast
    />
  )
}
