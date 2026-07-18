import { redirect } from 'next/navigation'
import Image from 'next/image'
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
      {/* School Header */}
      <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center">
        <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden mb-4">
          {school?.logo_url ? (
            <img src={school.logo_url} alt={`${school.name} Logo`} className="w-full h-full object-cover" />
          ) : (
            <Image src="/logo.png" alt="EduTrack" width={56} height={56} className="object-cover" />
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight uppercase">
          {school?.name || 'Your School'}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">School Management System</p>
      </div>

      <OnboardingWizard 
        totalStaff={totalStaff ?? 0}
        totalClasses={totalClasses ?? 0}
        totalSubjects={totalSubjects ?? 0}
        totalStudents={totalStudents ?? 0}
      />
      
      {/* Academic Overview */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        {/* Decorative blur inside card */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[50px] rounded-full pointer-events-none" />

        <div className="flex items-center gap-2 mb-5 relative z-10">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">Academic Overview</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {[
            { label: 'Students Enrolled', value: totalStudents ?? 0 },
            { label: 'Active Staff', value: totalStaff ?? 0 },
            { label: 'Total Classes', value: totalClasses ?? 0 },
            { label: 'Subjects Offered', value: totalSubjects ?? 0 },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 border border-white/20 rounded-2xl p-4 flex flex-col justify-center shadow-inner hover:bg-white/20 transition-colors">
              <p className="text-2xl font-bold text-white drop-shadow-sm">{stat.value}</p>
              <p className="text-xs font-semibold text-blue-50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operations */}
      <div>
        <SectionHeader title="OPERATIONS" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label="Active Routes"
            value="0"
            icon={Bus}
            color="text-emerald-500"
          />
          <MetricCard
            label="Books Issued"
            value="0"
            icon={BookOpen}
            color="text-indigo-500"
          />
          <MetricCard
            label="Inventory Items"
            value="0"
            icon={Package}
            color="text-amber-500"
          />
          <MetricCard
            label="Unread Messages"
            value="0"
            icon={Users}
            color="text-blue-500"
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

      {/* Finance Summary */}
      <div>
        <SectionHeader title="FINANCE SUMMARY" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <MetricCard
            label="Term Fees Collected"
            value={formatKES(totalCollected)}
            icon={Banknote}
            color="text-emerald-500"
          />
          <MetricCard
            label="Outstanding Arrears"
            value={formatKES(totalArrears)}
            icon={Clock}
            color="text-rose-500"
          />
        </div>
      </div>
    </div>
  )
}
