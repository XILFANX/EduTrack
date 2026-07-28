import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessagesLayout } from '@/components/shared/messages-layout'
import type { Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'

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

export default async function StaffMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/dashboard')
  
  const adminClient = createAdminClient()

  // 1. Fetch Staff Contacts
  const { data: staffData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id)
    .neq('role', 'parent')

  const staffContacts = (staffData || []).map((u: any) => ({
    id: u.id,
    name: u.salutation ? `${u.salutation} ${u.full_name}` : (u.full_name || 'Staff'),
    role: ROLE_LABEL[u.role] || u.role,
    roleOrder: ROLE_ORDER[u.role] ?? 5,
    last_seen_at: u.last_seen_at
  }))

  // 2. Fetch Parent Contacts
  const { data: parentData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .eq('role', 'parent')

  const parentContacts = (parentData || []).map((p: any) => ({
    id: p.id,
    name: p.salutation ? `${p.salutation} ${p.full_name}` : (p.full_name || 'Parent'),
    role: 'Parent',
    roleOrder: 4,
    last_seen_at: p.last_seen_at
  }))

  const contacts = [...staffContacts, ...parentContacts].sort((a, b) => a.roleOrder - b.roleOrder)

  // 3. Fetch Announcements
  // Non-teaching staff see announcements targeted to: all_users, all_staff
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .eq('school_id', profile.school_id)
    .in('target_audience', ['all_users', 'all_staff'])
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <MessagesLayout
      currentUser={{ id: user.id, role: profile.role }}
      contacts={contacts}
      classes={[]}
      initialContactId={undefined}
      announcements={(announcementsData as Announcement[]) || []}
      audienceOptions={[]} // Non-teaching staff cannot broadcast
    />
  )
}
