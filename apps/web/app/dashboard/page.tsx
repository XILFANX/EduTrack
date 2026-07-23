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
    { href: '/dashboard/staff', label: 'Staff', sublabel: 'Manage Staff', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border border-blue-500/20', hoverBg: 'group-hover:bg-blue-500/20' },
    { href: '/dashboard/students', label: 'Students', sublabel: 'Student Records', icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20', hoverBg: 'group-hover:bg-emerald-500/20' },
    { href: '/dashboard/classes', label: 'Classes', sublabel: 'Class Rosters', icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border border-amber-500/20', hoverBg: 'group-hover:bg-amber-500/20' },
    { href: '/dashboard/subjects', label: 'Subjects', sublabel: 'Subject Engine', icon: ClipboardList, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10 border border-violet-500/20', hoverBg: 'group-hover:bg-violet-500/20' },
    { href: '/dashboard/exams', label: 'Exams', sublabel: 'Examinations', icon: FileText, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border border-rose-500/20', hoverBg: 'group-hover:bg-rose-500/20' },
    { href: '/dashboard/timetable', label: 'Timetable', sublabel: 'School Schedule', icon: CalendarDays, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10 border border-teal-500/20', hoverBg: 'group-hover:bg-teal-500/20' },
    { href: '/dashboard/sessions', label: 'Sessions', sublabel: 'Academic Years', icon: CalendarRange, color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-500/10 border border-fuchsia-500/20', hoverBg: 'group-hover:bg-fuchsia-500/20' },
    { href: '/dashboard/messages', label: 'Comms', sublabel: 'Communications', icon: MessageSquare, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10 border border-sky-500/20', hoverBg: 'group-hover:bg-sky-500/20' },
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
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map(({ href, label, sublabel, icon: Icon, color, bg, hoverBg }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2.5 p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm group active:scale-95"
            >
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${bg} ${hoverBg} transition-colors`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="font-bold text-xs text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{label}</p>
                <p className="text-[10px] text-muted-foreground truncate hidden sm:block">{sublabel}</p>
              </div>
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
