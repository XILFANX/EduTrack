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
  label, value, icon: Icon, color
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</h2>
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

  const formatKES = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Context & Hero Card */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionHeader title="SCHOOL CONTEXT" />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-foreground shadow-sm">
            {school?.logo_url ? (
              <img src={school.logo_url} alt="Logo" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-[8px] text-blue-600 dark:text-blue-400">
                SC
              </div>
            )}
            {school?.name?.toUpperCase() || 'YOUR SCHOOL'}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
          {/* Decorative blur inside card */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                {profile.full_name || 'Administrator'}
              </h1>
              <p className="text-sm font-medium text-blue-100">
                {school?.name?.toUpperCase() || 'YOUR SCHOOL'} · Dashboard overview
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider mb-1">Collected MTD</p>
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{formatKES(totalCollected)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
            {[
              { label: 'Students', value: totalStudents ?? 0 },
              { label: 'Staff', value: totalStaff ?? 0 },
              { label: 'Classes', value: totalClasses ?? 0 },
              { label: 'Subjects', value: totalSubjects ?? 0 },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col justify-center shadow-inner">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs font-medium text-blue-100">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <OnboardingWizard 
        totalStaff={totalStaff ?? 0}
        totalClasses={totalClasses ?? 0}
        totalSubjects={totalSubjects ?? 0}
        totalStudents={totalStudents ?? 0}
      />

      {/* Finance Section */}
      <div>
        <SectionHeader title="FINANCE & OPERATIONS" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Collected"
            value={formatKES(totalCollected)}
            icon={Banknote}
            color="text-emerald-500"
          />
          <MetricCard
            label="Outstanding"
            value={formatKES(totalArrears)}
            icon={Clock}
            color="text-amber-500"
          />
          <MetricCard
            label="Active Routes"
            value="0"
            icon={Bus}
            color="text-blue-500"
          />
          <MetricCard
            label="Books Issued"
            value="0"
            icon={BookOpen}
            color="text-violet-500"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="QUICK ACTIONS" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: '/dashboard/staff', label: 'Add Staff', icon: Users, color: 'text-blue-500' },
            { href: '/dashboard/students', label: 'Add Student', icon: GraduationCap, color: 'text-indigo-500' },
            { href: '/dashboard/subjects', label: 'Manage Subjects', icon: BookOpen, color: 'text-emerald-500' },
            { href: '/bursar/dashboard', label: 'Record Payment', icon: Banknote, color: 'text-amber-500' },
          ].map(({ href, label, icon: Icon, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="font-bold text-sm">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
