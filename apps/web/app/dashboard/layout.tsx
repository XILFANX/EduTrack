import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { UserNav } from '@/components/shared/user-nav'
import { NotificationBell } from '@/components/shared/notification-bell'
import { PrincipalNav } from '@/components/principal/principal-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('full_name, role, school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any

  if (!profile) redirect('/onboarding')

  // Route non-principal roles to their correct portals
  if (profile?.role === 'admin') redirect('/admin/dashboard')
  if (profile?.role === 'parent') redirect('/parent/dashboard')
  if (profile?.role === 'class_teacher' || profile?.role === 'subject_teacher') redirect('/teacher/dashboard')
  if (profile?.role === 'bursar') redirect('/bursar/dashboard')
  if (profile?.role === 'librarian') redirect('/library/dashboard')
  if (profile?.role === 'storekeeper') redirect('/store/dashboard')
  if (profile?.role === 'transport_matron') redirect('/transport/dashboard')

  // Principal/Headteacher must complete onboarding before accessing dashboard
  if ((profile.role === 'principal' || profile.role === 'headteacher') && !profile.school_id) {
    redirect('/onboarding')
  }

  const roleLabel = profile.role === 'headteacher' ? 'Headteacher' : 'Principal'

  const initials = profile.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-muted/40 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white">
              <Image src="/logo.png" alt="EduTrack" fill className="object-cover " />
            </div>
            <div>
              <span className="font-semibold text-foreground text-sm dark:text-slate-100 block leading-tight">EduTrack</span>
              <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{roleLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserNav user={{ fullName: profile.full_name, role: roleLabel, initials }} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 pb-28">
        {children}
      </main>

      {/* Floating Bottom Nav */}
      <PrincipalNav />
    </div>
  )
}
