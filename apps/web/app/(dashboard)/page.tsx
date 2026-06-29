import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PerformanceChart } from '@/components/analytics/performance-chart'
import {
  Users, GraduationCap, Banknote, BookOpen,
  TrendingUp, AlertTriangle, Bus, Package,
  ArrowUpRight, CheckCircle2, Clock
} from 'lucide-react'

// Metric card component
function MetricCard({
  label, value, sub, icon: Icon, color, trend
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  trend?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </p>
        )}
      </div>
    </div>
  )
}

// Section header
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/onboarding')

  const schoolId = profile.school_id

  // Parallel data fetches
  const [
    { count: totalStudents },
    { count: totalStaff },
    { count: totalClasses },
    { data: recentPayments },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).neq('role', 'principal').is('deleted_at', null),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('payments').select('amount, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  // Mock chart data — real data connected once Supabase is live
  const cashFlowData = [
    { time: '2026-01-01', value: 180000 },
    { time: '2026-02-01', value: 320000 },
    { time: '2026-03-01', value: 290000 },
    { time: '2026-04-01', value: 410000 },
    { time: '2026-05-01', value: 375000 },
    { time: '2026-06-01', value: 490000 },
  ]

  const firstName = profile.full_name.split(' ')[0]

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your school overview for today.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Students"
          value={totalStudents ?? 0}
          sub="Enrolled & active"
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          trend="+3 this month"
        />
        <MetricCard
          label="Staff"
          value={totalStaff ?? 0}
          sub="Teachers & support"
          icon={GraduationCap}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
        />
        <MetricCard
          label="Classes"
          value={totalClasses ?? 0}
          sub="Active streams"
          icon={BookOpen}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
        />
        <MetricCard
          label="Fee Collection"
          value="78%"
          sub="This term"
          icon={Banknote}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
          trend="Up from 65%"
        />
      </div>

      {/* Fee Cash-Flow Chart */}
      <div>
        <SectionHeader
          title="Fee Collection Velocity"
          sub="Monthly cumulative fee revenue — KES"
        />
        <PerformanceChart
          data={cashFlowData}
          title=""
          colors={{
            lineColor: '#2563eb',
            areaTopColor: 'rgba(37, 99, 235, 0.45)',
            areaBottomColor: 'rgba(37, 99, 235, 0.03)',
          }}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/staff', label: 'Invite Staff', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
            { href: '/students', label: 'Add Student', icon: GraduationCap, color: 'bg-violet-600 hover:bg-violet-700' },
            { href: '/finance', label: 'View Finances', icon: Banknote, color: 'bg-emerald-600 hover:bg-emerald-700' },
            { href: '/reports', label: 'Reports', icon: TrendingUp, color: 'bg-slate-700 hover:bg-slate-800' },
          ].map(({ href, label, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-white font-semibold text-sm transition-all shadow-sm ${color}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Transport</span>
          </div>
          <p className="text-lg font-bold text-foreground">4 Routes</p>
          <p className="text-xs text-muted-foreground">All routes active</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Library</span>
          </div>
          <p className="text-lg font-bold text-foreground">3 Fines</p>
          <p className="text-xs text-muted-foreground">Pending clearance</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Store</span>
          </div>
          <p className="text-lg font-bold text-foreground">12 Items</p>
          <p className="text-xs text-muted-foreground">Low stock</p>
        </div>
      </div>
    </div>
  )
}
