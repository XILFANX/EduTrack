import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  Users, GraduationCap, Banknote, BookOpen,
  TrendingUp, AlertTriangle, Bus, Package,
  ArrowUpRight, CheckCircle2, Clock
} from 'lucide-react'
import Link from 'next/link'
import { OnboardingWizard } from './onboarding-wizard'

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

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// Simple inline bar chart — no external chart lib needed
function FeeBarChart({ collected, expected }: { collected: number; expected: number }) {
  const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0
  const formatKES = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Fee Collection This Term</p>
          <p className="text-xs text-muted-foreground">Total collected vs expected</p>
        </div>
        <span className="text-2xl font-bold text-blue-600">{pct}%</span>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-4">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Collected: <span className="text-emerald-600 font-semibold">{formatKES(collected)}</span></span>
        <span>Expected: <span className="text-foreground font-semibold">{formatKES(expected)}</span></span>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('full_name, school_id')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any

  if (!profile?.school_id) redirect('/onboarding')

  const schoolId = profile.school_id

  // Parallel data fetches
  const [
    { count: totalStudents },
    { count: totalStaff },
    { count: totalClasses },
    { count: totalSubjects },
    { data: invoicesRaw },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).neq('role', 'principal').is('deleted_at', null),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('invoices').select('amount, balance').eq('school_id', schoolId).is('deleted_at', null),
  ])

  // Aggregate fee totals
  const invoices = (invoicesRaw as any[]) || []
  const totalExpected = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0)
  const totalArrears = invoices.reduce((s: number, i: any) => s + Number(i.balance), 0)
  const totalCollected = totalExpected - totalArrears

  const firstName = profile.full_name.split(' ')[0]

  const hour = new Date().getHours()
  let greeting = 'Good evening'
  if (hour < 12) greeting = 'Good morning'
  else if (hour < 17) greeting = 'Good afternoon'

  return (
    <div className="space-y-7">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here&apos;s your school overview for today.
        </p>
      </div>

      <OnboardingWizard 
        totalStaff={totalStaff ?? 0}
        totalClasses={totalClasses ?? 0}
        totalSubjects={totalSubjects ?? 0}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Students"
          value={totalStudents ?? 0}
          sub="Enrolled & active"
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
        />
        <MetricCard
          label="Staff"
          value={totalStaff ?? 0}
          sub="Teachers & support"
          icon={GraduationCap}
          color="bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400"
        />
        <MetricCard
          label="Classes"
          value={totalClasses ?? 0}
          sub="Active streams"
          icon={BookOpen}
          color="bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400"
        />
        <MetricCard
          label="Fee Collection"
          value={totalExpected > 0 ? `${Math.round((totalCollected / totalExpected) * 100)}%` : '—'}
          sub="This term"
          icon={Banknote}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
        />
      </div>

      {/* Fee Collection Chart */}
      <div>
        <SectionHeader
          title="Fee Collection Velocity"
          sub="Collected vs expected this term — KES"
        />
        <FeeBarChart collected={totalCollected} expected={totalExpected} />
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/staff', label: 'Invite Staff', icon: Users, color: 'bg-blue-600 hover:bg-blue-700' },
            { href: '/dashboard/students', label: 'Add Student', icon: GraduationCap, color: 'bg-violet-600 hover:bg-violet-700' },
            { href: '/bursar/dashboard', label: 'View Finances', icon: Banknote, color: 'bg-emerald-600 hover:bg-emerald-700' },
            { href: '/dashboard', label: 'Overview', icon: TrendingUp, color: 'bg-slate-700 hover:bg-slate-800' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-white font-semibold text-sm transition-all shadow-sm ${color}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <Bus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Transport</span>
          </div>
          <p className="text-lg font-bold text-foreground">Routes</p>
          <p className="text-xs text-muted-foreground">View in Transport portal</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Library</span>
          </div>
          <p className="text-lg font-bold text-foreground">Books</p>
          <p className="text-xs text-muted-foreground">View in Library portal</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Package className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Store</span>
          </div>
          <p className="text-lg font-bold text-foreground">Inventory</p>
          <p className="text-xs text-muted-foreground">View in Store portal</p>
        </div>
      </div>
    </div>
  )
}
