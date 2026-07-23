import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { GraduationCap, TrendingUp, Clock, Users, ArrowRight } from 'lucide-react'
import { AdminRevenueChart } from '@/components/admin/admin-revenue-chart'

export const dynamic = 'force-dynamic'

const SUBSCRIPTION_PRICE = 99.99 // Example price per school

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (user.email !== process.env.PRODUCT_ADMINISTRATOR_EMAIL) {
    redirect('/dashboard')
  }

  const supabaseAdmin = await createAdminClient()

  const [
    { count: totalSchools },
    { count: activeSchools },
    { count: trialSchools },
    { data: recentSchools },
    { count: totalUsers },
    { data: allActiveSchools }
  ] = await Promise.all([
    supabaseAdmin.from('schools').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('schools').select('id', { count: 'exact', head: true }).neq('subscription_plan', 'Trial'),
    supabaseAdmin.from('schools').select('id', { count: 'exact', head: true }).eq('subscription_plan', 'Trial'),
    supabaseAdmin.from('schools').select('id, name, subscription_plan, created_at').order('created_at', { ascending: false }).limit(6),
    supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabaseAdmin.from('schools').select('created_at').neq('subscription_plan', 'Trial')
  ])

  const firstName = user.email ? user.email.split('@')[0] : 'Admin'

  // Calculate MRR historically based on active subscriptions
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    
    const monthYear = d.getFullYear() * 100 + d.getMonth()
    
    let activeInMonth = 0
    ;(allActiveSchools || []).forEach(s => {
      if (!s.created_at) return
      const cd = new Date(s.created_at)
      const cMonthYear = cd.getFullYear() * 100 + cd.getMonth()
      if (cMonthYear <= monthYear) {
        activeInMonth++
      }
    })

    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: activeInMonth * SUBSCRIPTION_PRICE,
    }
  })

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            EduTrack Global
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Welcome back, {firstName}. Here is your global command center.
          </p>
        </div>
      </header>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: totalSchools ?? 0, icon: GraduationCap, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
          { label: 'Active Subs', value: activeSchools ?? 0, icon: TrendingUp, color: 'from-emerald-400 to-emerald-600', shadow: 'shadow-emerald-500/20' },
          { label: 'On Trial', value: trialSchools ?? 0, icon: Clock, color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
          { label: 'Total Users', value: totalUsers ?? 0, icon: Users, color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-500/20' },
        ].map(({ label, value, icon: Icon, color, shadow }) => (
          <div key={label} className="relative group overflow-hidden rounded-[24px] bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 p-5 backdrop-blur-xl transition-all hover:shadow-xl dark:hover:border-slate-700">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.08] dark:opacity-[0.15] blur-2xl rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700`} />
            <div className="relative z-10 flex flex-col gap-4">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column: Chart & Schools ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AdminRevenueChart data={monthsData} />

          {/* Recent Schools */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Latest Registered Schools
              </h2>
              <Link href="/admin/schools" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors flex items-center gap-1 group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {!recentSchools || recentSchools.length === 0 ? (
              <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-foreground font-bold">No schools yet</p>
                <p className="text-sm text-muted-foreground mt-1">When schools register, they will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentSchools.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-base font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{s.name}</p>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm ${
                      s.subscription_plan !== 'Trial' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50' :
                      'bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50'
                    }`}>
                      {s.subscription_plan}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)] pointer-events-none opacity-50 dark:opacity-30" />
            <h2 className="text-base font-extrabold text-foreground mb-4 relative z-10">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3 relative z-10">
              {[
                { label: 'Manage Schools', href: '/admin/schools', icon: '🏫' },
                { label: 'View Analytics', href: '/admin/dashboard', icon: '📊' },
                { label: 'Manage Admins', href: '/admin/admins', icon: '🔐' },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 rounded-2xl p-4 flex items-center gap-3 transition-all text-sm font-bold text-slate-700 dark:text-slate-200 group">
                  <span className="text-xl group-hover:scale-110 transition-transform">{a.icon}</span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
