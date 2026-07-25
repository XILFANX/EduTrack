import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'
import { LogOut, Bell } from 'lucide-react'

export const metadata: Metadata = {
  title: 'EduTrack Admin',
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduTrack',
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = process.env.PRODUCT_ADMINISTRATOR_EMAIL
  const isRoot = user.email === ROOT_EMAIL

  let profile = null

  if (!isRoot) {
    const { data: p } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    
    if (!p || p.role !== 'admin') {
      redirect('/login')
    }
    profile = p
  }

  const fullName = isRoot ? 'Planck Networks' : (profile?.full_name || 'Admin')
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0F] flex flex-col selection:bg-blue-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-[#0A0A0F]/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 relative rounded-[14px] overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform bg-white flex items-center justify-center font-bold text-blue-600 text-xs">
              EduTrack
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white block leading-tight tracking-tight text-[15px]">EduTrack</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isRoot ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`}></span>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isRoot ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                  {isRoot ? 'Root Administrator' : 'Platform Admin'}
                </span>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse border-2 border-white dark:border-[#0A0A0F]" />
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-foreground">{fullName}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{isRoot ? 'Root' : 'Admin'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                {initials}
              </div>
              <form action="/api/auth/signout" method="post" className="ml-1">
                <button title="Sign out" className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {children}
      </main>

      {/* Floating Bottom Nav */}
      <AdminNav isRoot={isRoot} />
    </div>
  )
}
