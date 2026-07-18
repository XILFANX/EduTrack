import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquare, Megaphone } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsClient } from '@/components/shared/announcements-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'
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

export default async function PrincipalMessagesPage() {
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

  // 1. Fetch Contacts
  // Staff
  const { data: staffData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id) // Exclude self
    .neq('role', 'parent')

  // Parents
  const { data: parentsData } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .eq('role', 'parent')

  // Find parents' students
  let parentsWithStudents: any[] = []
  if (parentsData && parentsData.length > 0) {
    const parentIds = parentsData.map(p => p.id)
    const { data: links } = await adminClient
      .from('student_parents' as any)
      .select('parent_id, student_id, students(first_name, last_name)')
      .in('parent_id', parentIds)

    const parentStudentMap: Record<string, string[]> = {}
    ;((links as any[]) || []).forEach((l: any) => {
      if (!parentStudentMap[l.parent_id]) parentStudentMap[l.parent_id] = []
      if (l.students) {
        parentStudentMap[l.parent_id].push(`${l.students.first_name} ${l.students.last_name}`)
      }
    })

    parentsWithStudents = parentsData.map((p: any) => ({
      ...p,
      studentNames: parentStudentMap[p.id] || [],
    }))
  }

  // EduTrack Admin
  const { data: platformAdmin } = await adminClient
    .from('users')
    .select('id, full_name, salutation, role, last_seen_at')
    .eq('role', 'platform_owner')
    .limit(1)
    .single()

  const staffContacts = (staffData || []).map((s: any) => ({
    id: s.id,
    name: s.salutation ? `${s.salutation} ${s.full_name}` : (s.full_name || 'Staff Member'),
    role: ROLE_LABEL[s.role] || s.role.replace('_', ' '),
    roleOrder: ROLE_ORDER[s.role] ?? 5,
    last_seen_at: s.last_seen_at
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

  if (platformAdmin) {
    contacts.unshift({
      id: platformAdmin.id,
      name: platformAdmin.salutation ? `${platformAdmin.salutation} ${platformAdmin.full_name}` : 'EduTrack Support',
      role: 'Platform Admin',
      roleOrder: -1,
      last_seen_at: platformAdmin.last_seen_at,
      subtitle: undefined
    })
  }

  // 2. Fetch Announcements
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const audienceOptions = [
    { value: 'all_users', label: 'All Users (Staff & Parents)' },
    { value: 'all_staff', label: 'All Staff' },
    { value: 'all_parents', label: 'All Parents' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage announcements and direct messages.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Announcements */}
        <div className="xl:col-span-1 space-y-6">
          <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" />
              <h2 className="font-semibold text-foreground">New Broadcast</h2>
            </div>
            <div className="p-5">
              <AnnouncementsClient audienceOptions={audienceOptions} />
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-3 text-sm px-1">Recent Announcements</h3>
            <AnnouncementsFeed announcements={(announcementsData as Announcement[]) || []} />
          </section>
        </div>

        {/* Right Column: Direct Messages */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-foreground">Direct Messages</h2>
          </div>
          
          <ChatClient 
            currentUser={{ id: user.id, role: profile.role }} 
            contacts={contacts} 
          />
        </div>
        
      </div>
    </div>
  )
}
