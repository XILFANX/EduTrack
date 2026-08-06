import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Building2, TrendingUp, Users, ArrowRight, BarChart3, DatabaseZap, Shield, Receipt } from 'lucide-react'
import { AdminRevenueChart } from '@/components/admin/admin-revenue-chart'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
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
      redirect('/dashboard')
    }
    profile = p
  }

  const fullName = isRoot ? 'Planck Networks' : (profile?.full_name || 'Admin')
  const firstName = fullName.split(' ')[0]

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const { count: totalSchools } = await admin.from('schools').select('id', { count: 'exact', head: true })
  const { count: totalStudents } = await admin.from('students').select('id', { count: 'exact', head: true }).is('deleted_at', null)
  
  const { data: recentSchoolsData } = await admin.from('schools').select('*').order('created_at', { ascending: false }).limit(3)
  const recentSchools = recentSchoolsData as any[]

  const { data: adminUsers } = await admin.from('users').select('id, full_name, email, created_at').eq('role', 'admin').order('created_at')
  const { count: totalAdmins } = await admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin')
  const { data: invoicesData } = await admin.from('invoices').select('*').is('deleted_at', null).gte('created_at', sixMonthsAgo.toISOString())
  const invoices = invoicesData as any[]

  let totalCollected = 0
  
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: 0,
      yearMonth: `${d.getFullYear()}-${d.getMonth()}`
    }
  })

  ;(invoices || []).forEach(inv => {
    const collected = (inv.amount || 0) - (inv.balance || 0)
    totalCollected += collected
    if (!inv.created_at) return
    const d = new Date(inv.created_at)
    const ym = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = monthsData.find(m => m.yearMonth === ym)
    if (bucket) {
      bucket.revenue += collected
    }
  })

  const chartData = monthsData.map(({ month, revenue }) => ({ month, revenue }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* ── Header ── */}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Platform Overview</h1>
        <p className="text-base text-muted-foreground">
          Welcome back, {firstName}. Here is your global command center.
        </p>
      </header>

      {/* ── Stats Grid (Hero Layout) ── */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
        <div className="flex items-center gap-2 mb-5 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Platform Stats</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {[
            { label: 'Active Schools', value: totalSchools ?? 0 },
            { label: 'Total Students', value: totalStudents ?? 0 },
            { label: 'Platform Revenue', value: `KSh ${(totalCollected/1000000).toFixed(1)}M` },
            { label: 'Platform Admins', value: totalAdmins ?? 0 },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col justify-center shadow-inner hover:bg-white/20 transition-colors">
              <p className="text-2xl font-bold text-white drop-shadow-sm">{stat.value}</p>
              <p className="text-xs font-semibold text-cyan-50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* ── Left Column: Chart & Recent Signups ── */}
        <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">
          
          <AdminRevenueChart data={chartData} />

          {/* Recent Signups */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-500" />
                Latest Registered Schools
              </h2>
              <Link href="/admin/schools" className="text-sm font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 transition-colors flex items-center gap-1 group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {!recentSchools || recentSchools.length === 0 ? (
              <div className="px-6 py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-foreground font-bold text-lg">No schools yet</p>
                <p className="text-sm text-muted-foreground mt-1">When schools register, they will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentSchools.map((s) => (
                  <Link key={s.id} href={`/admin/schools`} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-base font-bold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{s.name}</p>
                        <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{s.domain || 'No domain'}</span>
                          <span>·</span>
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-sm bg-cyan-50 text-cyan-600 border border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800/50">
                      {s.subscription_tier}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-6 md:gap-8">
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-24 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)] pointer-events-none opacity-50 dark:opacity-30" />
            <h2 className="text-base font-extrabold text-foreground mb-4 relative z-10">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 relative z-10">
              {[
                { label: 'Manage Schools', href: '/admin/schools', icon: Building2 },
                { label: 'View Analytics', href: '/admin/analytics', icon: BarChart3 },
                { label: 'Manage Admins', href: '/admin/admins', icon: Shield },
                { label: 'Optimize System', href: '/admin/optimization', icon: DatabaseZap },
              ].map((a) => {
                const Icon = a.icon
                return (
                  <Link key={a.href} href={a.href}
                    className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 hover:bg-accent hover:border-accent-foreground/20 transition-all text-sm text-foreground font-medium shadow-sm group">
                    <Icon className="w-5 h-5 text-cyan-500 group-hover:text-cyan-600 transition-colors" />
                    {a.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Admin Users */}
          <div className="bg-white dark:bg-slate-900/50 border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                Team
              </h2>
            </div>
            <div className="divide-y divide-border/50">
              <div className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300 text-sm font-bold flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800">
                  PN
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Planck Networks</p>
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                    Root Administrator
                  </p>
                </div>
              </div>
              {adminUsers?.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {a.full_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{a.full_name}</p>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                      Since {a.created_at ? new Date(a.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900/50">
              <Link href="/admin/admins"
                className="flex items-center justify-center w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-700 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm font-bold text-slate-700 dark:text-slate-300 py-3 rounded-xl transition-all shadow-sm">
                Manage Team
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
