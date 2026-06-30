import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Library, LogOut } from 'lucide-react'
import { LibraryNav } from '@/components/library/library-nav'

export default async function LibraryLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (profile?.role !== 'librarian') redirect('/login')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{profile.full_name}</p>
              <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">Library Portal</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4 pt-6">{children}</main>
      <LibraryNav />
    </div>
  )
}
