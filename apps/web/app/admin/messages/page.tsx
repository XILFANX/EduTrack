import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessagesLayout } from '@/components/shared/messages-layout'
import type { Announcement } from '@/components/shared/announcements-feed'

export const dynamic = 'force-dynamic'

export default async function AdminMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = process.env.PRODUCT_ADMINISTRATOR_EMAIL
  const isRoot = user.email === ROOT_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') redirect('/admin/dashboard')
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  // Fetch principals
  const { data: principals } = await admin
    .from('users')
    .select('id, full_name, role')
    .eq('role', 'principal')

  const contacts = (principals || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || 'Principal',
    role: p.role,
  }))

  const currentUser = { id: user.id, role: 'platform_admin' }

  // Global platform announcements
  const { data: announcementsData } = await admin
    .from('announcements')
    .select('*, users(full_name, salutation)')
    .is('school_id', null)
    .order('created_at', { ascending: false })
    .limit(15)

  return (
    <MessagesLayout
      currentUser={currentUser}
      contacts={contacts}
      classes={[]}
      initialContactId={undefined}
      announcements={(announcementsData as Announcement[]) || []}
      audienceOptions={[{ value: 'all_principals', label: 'All Principals' }]}
    />
  )
}
