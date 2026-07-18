import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import {
  Users, GraduationCap, Banknote, BookOpen,
  Bus, Package, Clock, CalendarRange,
  ClipboardList, MessageSquare, FileText, ChevronRight, CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import { OnboardingWizard } from './onboarding-wizard'

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

  const [
    { data: schoolRaw },
    { count: totalStudents },
    { count: totalStaff },
    { count: totalClasses },
    { count: totalSubjects },
    { data: invoicesRaw },
    { data: activeTerm },
  ] = await Promise.all([
    supabase.from('schools').select('name, logo_url').eq('id', schoolId).single(),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).neq('role', 'principal').neq('role', 'parent').is('deleted_at', null),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('subjects').select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('invoices').select('amount, balance').eq('school_id', schoolId).is('deleted_at', null),
    supabase.from('academic_terms').select('name, academic_years(name)').eq('school_id', schoolId).eq('is_active', true).single(),
  ])

  const school = schoolRaw as any
  const invoices = (invoicesRaw as any[]) || []
  const totalExpected = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0)
  const totalArrears = invoices.reduce((s: number, i: any) => s + Number(i.balance), 0)
  const totalCollected = totalExpected - totalArrears

  const formatKES = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

  const quickActions = [
    { href: '/dashboard/staff', label: 'Manage Staff', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { href: '/dashboard/students', label: 'Manage Students', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { href: '/dashboard/exams', label: 'Examinations', icon: ClipboardList, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarDays, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { href: '/dashboard/reports', label: 'Report Cards', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { href: '/dashboard/sessions', label: 'Sessions Engine', icon: CalendarRange, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { href: '/dashboard/subjects', label: 'Manage Subjects', icon: BookOpen, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]

  const operationModules = [
    { href: '/dashboard/transport', label: 'Transport', icon: Bus, color: 'text-emerald-500' },
    { href: '/dashboard/library', label: 'Library', icon: BookOpen, color: 'text-indigo-500' },
    { href: '/dashboard/store', label: 'Store', icon: Package, color: 'text-amber-500' },
    { href: '/dashboard/timetable', label: 'Timetable', icon: CalendarDays, color: 'text-indigo-500' },
    { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare, color: 'text-rose-500' },
    { href: '/dashboard/exams', label: 'Exams', icon: ClipboardList, color: 'text-purple-500' },
    { href: '/dashboard/sessions', label: 'Sessions', icon: CalendarRange, color: 'text-blue-500' },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText, color: 'text-teal-500' },
    { href: '/dashboard/settings', label: 'Settings', icon: Package, color: 'text-slate-500' },
  ]

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
        {activeTerm && (
          <p className="text-xs font-semibold text-blue-600 mt-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
            Active: {(activeTerm as any).academic_years?.name} — {activeTerm.name}
          </p>
        )}
      </div>

      <OnboardingWizard
        totalStaff={totalStaff ?? 0}
        totalClasses={totalClasses ?? 0}
        totalSubjects={totalSubjects ?? 0}
        totalStudents={totalStudents ?? 0}
      />

      {/* Academic Overview */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
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

      {/* Quick Actions */}
      <div>
        <SectionHeader title="QUICK ACTIONS" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(({ href, label, icon: Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-foreground hover:scale-[1.02] hover:shadow-md dark:hover:bg-slate-800/50 transition-all shadow-sm group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} transition-colors`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <span className="font-semibold text-xs text-center text-foreground leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Finance Summary */}
      <div>
        <SectionHeader title="FINANCE SUMMARY" />
        <div className="grid grid-cols-2 gap-3">
          <Link href="/bursar/dashboard" className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <Banknote className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xl font-bold text-foreground">{formatKES(totalCollected)}</p>
              <p className="text-xs font-medium text-slate-500">Term Fees Collected</p>
            </div>
          </Link>
          <Link href="/bursar/invoices" className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <Clock className="w-5 h-5 text-rose-500" />
            <div>
              <p className="text-xl font-bold text-foreground">{formatKES(totalArrears)}</p>
              <p className="text-xs font-medium text-slate-500">Outstanding Arrears</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
