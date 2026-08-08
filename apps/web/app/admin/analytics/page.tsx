import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Building2, Users, Receipt, PieChart, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = process.env.PRODUCT_ADMINISTRATOR_EMAIL
  const isRoot = user.email === ROOT_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') redirect('/dashboard')
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const admin = await createAdminClient()

  // ── Growth — schools by month (last 6 months) ──
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)

  const { data: schoolsByMonth } = await admin
    .from('schools')
    .select('created_at')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at')

  // ── Subscription breakdown ──
  const { data: allSchoolsData } = await admin.from('schools').select('*')
  const allSchools = allSchoolsData as any[]
  
  const tierCounts: Record<string, number> = { basic: 0, standard: 0, premium: 0 }
  for (const s of allSchools ?? []) {
    const t = s.subscription_tier || 'basic'
    tierCounts[t] = (tierCounts[t] ?? 0) + 1
  }

  // ── Students count & top schools ──
  const { data: studentsData } = await admin.from('students').select('school_id').is('deleted_at', null)
  const studentCountPerSchool: Record<string, number> = {}
  for (const s of studentsData ?? []) {
    studentCountPerSchool[s.school_id] = (studentCountPerSchool[s.school_id] ?? 0) + 1
  }
  
  const totalStudents = studentsData?.length ?? 0

  const topSchools = (allSchools ?? [])
    .map(s => ({ name: s.name, count: studentCountPerSchool[s.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // ── Financial Volume ──
  const { data: invoicesData } = await admin.from('invoices').select('*').is('deleted_at', null)
  const invoices = invoicesData as any[]
  
  let totalBilled = 0
  let totalCollected = 0
  for (const inv of invoices ?? []) {
    totalBilled += inv.amount || 0
    totalCollected += (inv.amount || 0) - (inv.balance || 0)
  }

  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0

  // ── Monthly growth buckets ──
  const monthBuckets: Record<string, number> = {}
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    monthBuckets[`${MONTHS[d.getMonth()]} ${d.getFullYear()}`] = 0
  }
  for (const s of schoolsByMonth ?? []) {
    const d = new Date(s.created_at!)
    const key = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
    if (key in monthBuckets) monthBuckets[key]++
  }
  const maxBucket = Math.max(...Object.values(monthBuckets), 1)

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Business Analytics</h1>
        <p className="text-base text-muted-foreground">Platform-wide performance and growth metrics</p>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: allSchools?.length ?? 0, Icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Students', value: totalStudents, Icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Platform Billed', value: `KSh ${(totalBilled/1000000).toFixed(1)}M`, Icon: Receipt, color: 'text-red-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Platform Collected', value: `KSh ${(totalCollected/1000000).toFixed(1)}M`, Icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-[#060d1a]/80 border border-slate-200 dark:border-[#1a2744]/60 rounded-3xl p-5 hover:shadow-lg transition-all duration-300">
            <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center mb-4`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subscription Mix */}
        <div className="bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <PieChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">Subscription Mix</h2>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Premium', count: tierCounts.premium ?? 0, color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
              { label: 'Standard', count: tierCounts.standard ?? 0, color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
              { label: 'Basic', count: tierCounts.basic ?? 0, color: 'bg-slate-500', textColor: 'text-slate-700 dark:text-slate-400' },
            ].map(({ label, count, color, textColor }) => {
              const total = (allSchools?.length ?? 0)
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">{label}</span>
                    <span className={`font-black ${textColor}`}>{count} <span className="opacity-60 text-xs">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#0d1b2e] rounded-full h-3 overflow-hidden">
                    <div className={`${color} h-3 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Schools */}
        <div className="bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">Top Schools by Enrollment</h2>
          </div>
          {topSchools.length === 0 ? (
            <div className="flex-1 flex items-center justify-center h-40">
              <p className="text-sm font-semibold text-muted-foreground">No students registered yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSchools.map((s) => {
                const pct = Math.round((s.count / totalStudents) * 100)
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-bold text-foreground text-sm truncate pr-4">{s.name}</span>
                      <span className="font-black text-slate-700 dark:text-slate-300 shrink-0">{s.count} <span className="opacity-60 text-xs">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#0d1b2e] rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* School growth chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-32 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)] pointer-events-none opacity-50" />
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-extrabold text-foreground tracking-tight">New Schools — Last 6 Months</h2>
          </div>
          <div className="flex items-end justify-around h-48 mt-auto relative z-10 w-full px-4">
            {Object.entries(monthBuckets).map(([month, count]) => (
              <div key={month} className="flex flex-col items-center gap-3 w-12 group">
                <span className={`text-sm font-black transition-opacity ${count > 0 ? 'text-foreground opacity-100' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'}`}>{count}</span>
                <div className="w-full bg-slate-100 dark:bg-[#0d1b2e] rounded-t-xl h-full flex items-end overflow-hidden relative">
                  <div
                    className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-xl transition-all duration-700 ease-out"
                    style={{ height: `${count > 0 ? Math.max((count / maxBucket) * 100, 5) : 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase">{month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Collection summary */}
          <div className="bg-white dark:bg-[#060d1a]/80 border border-border rounded-3xl p-6 shadow-sm flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">Fee Collections</h2>
            </div>
            
            <div className="mt-8 flex items-center justify-center">
               <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-100 dark:text-slate-800" />
                    <circle 
                      cx="50" cy="50" r="40" 
                      stroke="currentColor" strokeWidth="8" fill="none" 
                      className="text-blue-600 transition-all duration-1000 ease-out"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * collectionRate) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">{collectionRate}%</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Rate</span>
                  </div>
               </div>
            </div>
            
            <p className="text-center text-sm font-semibold text-muted-foreground mt-8">
              KSh {(totalCollected / 1000000).toFixed(1)}M collected out of KSh {(totalBilled / 1000000).toFixed(1)}M billed across all schools.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
