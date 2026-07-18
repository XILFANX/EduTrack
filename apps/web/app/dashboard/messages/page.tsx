import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MessageSquare, Megaphone } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsClient } from '@/components/shared/announcements-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PrincipalMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') redirect('/dashboard')

  const adminClient = createAdminClient()

  // 1. Fetch Contacts
  // Admin can see: all staff in their school, all parents linked to their school, and platform owner.
  
  // Staff
  const { data: staffData } = await adminClient
    .from('users')
    .select('id, full_name, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .neq('id', user.id) // Exclude self
    .in('role', ['admin', 'class_teacher', 'subject_teacher', 'bursar', 'library', 'store', 'transport'])

  // Parents (Parents don't have a direct school_id on 'users' sometimes, or do they? 
  // Let's assume parents are in the 'users' table with role 'parent' and school_id set.)
  const { data: parentsData } = await adminClient
    .from('users')
    .select('id, full_name, role, last_seen_at')
    .eq('school_id', profile.school_id)
    .eq('role', 'parent')

  // EduTrack Admin
  const { data: platformAdmin } = await adminClient
    .from('users')
    .select('id, full_name, role, last_seen_at')
    .eq('role', 'platform_owner')
    .limit(1)
    .single()

  const contacts = [
    ...(staffData || []).map(s => ({
      id: s.id,
      name: s.full_name || 'Staff Member',
      role: s.role.replace('_', ' '),
      last_seen_at: s.last_seen_at
    })),
    ...(parentsData || []).map(p => ({
      id: p.id,
      name: p.full_name || 'Parent',
      role: 'Parent',
      last_seen_at: p.last_seen_at
    }))
  ]

  if (platformAdmin) {
    contacts.unshift({
      id: platformAdmin.id,
      name: 'EduTrack Support',
      role: 'Platform Admin',
      last_seen_at: platformAdmin.last_seen_at
    })
  }

  // 2. Fetch Announcements
  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*, users(full_name)')
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
