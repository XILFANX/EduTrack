import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatClient } from '@/components/shared/chat-client'

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

  const currentUser = { id: user.id, role: 'admin' }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">Messages</h1>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900/50 border border-border rounded-3xl shadow-sm overflow-hidden flex min-h-0">
        <ChatClient 
          currentUser={currentUser} 
          contacts={contacts} 
        />
      </div>
    </div>
  )
}
