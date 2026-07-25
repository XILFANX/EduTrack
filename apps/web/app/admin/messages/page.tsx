import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Search } from 'lucide-react'

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
    .select('id, full_name, email')
    .eq('role', 'principal')
    .limit(10)

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
      <header className="flex flex-col gap-1 shrink-0">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Messages</h1>
        <p className="text-base text-muted-foreground flex items-center gap-2">
          Direct communication with school principals.
        </p>
      </header>

      <div className="flex-1 bg-white dark:bg-slate-900/50 border border-border rounded-3xl shadow-sm overflow-hidden flex min-h-0">
        
        {/* Sidebar */}
        <div className="w-80 border-r border-border flex flex-col bg-slate-50/50 dark:bg-slate-800/20">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search principals..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-border/50">
            {!principals || principals.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No principals found.
              </div>
            ) : (
              principals.map(p => (
                <button key={p.id} className="w-full text-left p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                    {p.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-[#0A0A0F]/50">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
          <p className="font-bold text-foreground">Select a conversation</p>
          <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
            Choose a principal from the sidebar to view their message history and send new direct messages.
          </p>
        </div>

      </div>
    </div>
  )
}
