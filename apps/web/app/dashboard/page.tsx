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
  label, value, sub, icon: Icon, trend
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  trend?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1 font-medium">{sub}</p>}
        {trend && (
          <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-2 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />{trend}
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
    { data: schoolRaw },
    { count: totalStudents },
    { count: totalStaff },
    { count: totalClasses },
    { count: totalSubjects },
    { data: invoicesRaw },
  ] = await Promise.all([
    supabase.from('schools').select('name, logo_url').eq('id', schoolId).single(),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).neq('role', 'principal').is('deleted_at', null),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('invoices').select('amount, balance').eq('school_id', schoolId).is('deleted_at', null),
  ])

  const school = schoolRaw as any

  // Aggregate fee totals
  const invoices = (invoicesRaw as any[]) || []
  const totalExpected = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0)
  const totalArrears = invoices.reduce((s: number, i: any) => s + Number(i.balance), 0)
  const totalCollected = totalExpected - totalArrears

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-950 border-[6px] border-white dark:border-slate-900 shadow-xl flex items-center justify-center overflow-hidden mb-6 relative z-10">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={`${school.name} Logo`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
              {school?.name?.substring(0, 2).toUpperCase() || 'SC'}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight relative z-10">{school?.name || 'Your School'}</h1>
        <p className="text-sm font-medium text-slate-500 mt-2 max-w-md relative z-10">Administrative Dashboard & Overview</p>
      </div>

      <OnboardingWizard 
        totalStaff={totalStaff ?? 0}
        totalClasses={totalClasses ?? 0}
        totalSubjects={totalSubjects ?? 0}
        totalStudents={totalStudents ?? 0}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Students"
          value={totalStudents ?? 0}
          sub="Enrolled & active"
          icon={Users}
        />
        <MetricCard
          label="Staff"
          value={totalStaff ?? 0}
          sub="Teachers & support"
          icon={GraduationCap}
        />
        <MetricCard
          label="Classes"
          value={totalClasses ?? 0}
          sub="Active streams"
          icon={BookOpen}
        />
        <MetricCard
          label="Fee Collection"
          value={totalExpected > 0 ? `${Math.round((totalCollected / totalExpected) * 100)}%` : '—'}
          sub="This term"
          icon={Banknote}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: '/dashboard/staff', label: 'Invite Staff', icon: Users },
            { href: '/dashboard/students', label: 'Add Student', icon: GraduationCap },
            { href: '/dashboard/subjects', label: 'Manage Subjects', icon: BookOpen },
            { href: '/bursar/dashboard', label: 'View Finances', icon: Banknote },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-3 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all font-bold text-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                <Icon className="w-6 h-6" />
              </div>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* System Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Bus className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Transport</span>
          </div>
          <p className="text-xl font-extrabold text-foreground">Routes</p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">View in Transport portal →</p>
          <div className="absolute right-[-20%] bottom-[-20%] opacity-5 group-hover:opacity-10 transition-opacity">
            <Bus className="w-32 h-32" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Library</span>
          </div>
          <p className="text-xl font-extrabold text-foreground">Books</p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">View in Library portal →</p>
          <div className="absolute right-[-20%] bottom-[-20%] opacity-5 group-hover:opacity-10 transition-opacity">
            <BookOpen className="w-32 h-32" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col gap-2 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Store</span>
          </div>
          <p className="text-xl font-extrabold text-foreground">Inventory</p>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">View in Store portal →</p>
          <div className="absolute right-[-20%] bottom-[-20%] opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="w-32 h-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
