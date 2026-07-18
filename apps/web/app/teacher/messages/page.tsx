import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquare, Megaphone } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsClient } from '@/components/shared/announcements-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

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

  // 1. Fetch Contacts
  // Teachers can see: Other teachers, Admin, Parents of their students.
  
  // Admin & Other Teachers
  const { data: colleagues } = await adminClient
    .from('users')
    .select('id, full_name, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id) // Exclude self
    .in('role', ['admin', 'class_teacher', 'subject_teacher'])

  // Find students in their class to get the parents
  let parentIds: string[] = []
  let audienceOptions: {value: string, label: string}[] = []

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
        .select('id')
        .eq('class_id', cls.id)
      
      const studentIds = (students || []).map(s => s.id)
      
      if (studentIds.length > 0) {
        const { data: studentParents } = await adminClient
          .from('student_parents' as any)
          .select('parent_id')
          .in('student_id', studentIds)
        
        parentIds = ((studentParents as any[]) || []).map((sp: any) => sp.parent_id)
      }
    }
  }

  let parentsData: any[] = []
  if (parentIds.length > 0) {
    const { data } = await adminClient
      .from('users')
      .select('id, full_name, role, last_seen_at')
      .in('id', parentIds)
    if (data) parentsData = data
  }

  const contacts = [
    ...(colleagues || []).map(c => ({
      id: c.id,
      name: c.full_name || 'Staff',
      role: c.role === 'admin' ? 'Admin / Principal' : 'Teacher',
      last_seen_at: c.last_seen_at
    })),
    ...(parentsData).map(p => ({
      id: p.id,
      name: p.full_name || 'Parent',
      role: 'Parent',
      last_seen_at: p.last_seen_at
    }))
  ]

  // 2. Fetch Announcements
  // Teachers should see: global announcements + their own class announcements
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name)')
    .eq('school_id', profile.school_id)
    // Basic filter: we'll show global and all staff. We could refine this to only show their class if they aren't admin.
    .in('target_audience', ['all_users', 'all_staff', 'all_teachers', ...(audienceOptions.map(o => o.value))])
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">Message parents, staff, and post class announcements.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Announcements */}
        <div className="xl:col-span-1 space-y-6">
          {profile.role === 'class_teacher' && audienceOptions.length > 0 && (
            <section className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-foreground">Class Broadcast</h2>
              </div>
              <div className="p-5">
                <AnnouncementsClient audienceOptions={audienceOptions} />
              </div>
            </section>
          )}

          <section>
            <h3 className="font-semibold text-foreground mb-3 text-sm px-1">Announcements Feed</h3>
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
