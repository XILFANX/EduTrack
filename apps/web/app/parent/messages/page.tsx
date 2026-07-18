import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquare, Megaphone } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ParentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'parent') redirect('/dashboard')

  const adminClient = createAdminClient()

  // 1. Fetch Contacts
  // Parents can see: Their children's teachers (class teachers for sure, maybe subject), and Admin.
  
  const { data: adminData } = await adminClient
    .from('users')
    .select('id, full_name, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .eq('role', 'admin')

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
      .select('id, full_name, role, last_seen_at')
      .in('id', teacherIds)
    if (data) teachersData = data
  }

  const contacts = [
    ...(adminData || []).map(a => ({
      id: a.id,
      name: a.full_name || 'School Admin',
      role: 'Admin',
      last_seen_at: a.last_seen_at
    })),
    ...(teachersData).map(t => ({
      id: t.id,
      name: t.full_name || 'Teacher',
      role: 'Class Teacher',
      last_seen_at: t.last_seen_at
    }))
  ]

  // 2. Fetch Announcements
  // Parents should see: global announcements + their children's class announcements
  const targetAudiences = ['all_users', 'all_parents', ...(classIds.map(id => `class_${id}`))]

  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name)')
    .eq('school_id', profile.school_id)
    .in('target_audience', targetAudiences)
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">Read school announcements and message teachers.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Announcements */}
        <div className="xl:col-span-1 space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Megaphone className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
            </div>
            <AnnouncementsFeed announcements={(announcementsData as Announcement[]) || []} />
          </section>
        </div>

        {/* Right Column: Direct Messages */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">Direct Messages</h2>
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
