import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, BookOpen, GraduationCap, Users, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ManageClientCard } from './manage-client-card'
import { getClientCountryDetails } from '@/lib/utils/country'

export default async function AdminSchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ROOT_EMAIL = 'plancknetworks@gmail.com'
  const isRoot = user.email === ROOT_EMAIL

  if (!isRoot) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') redirect('/admin/dashboard')
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const supabaseAdmin = await createAdminClient()

  const { data: school } = await supabaseAdmin
    .from('schools')
    .select('*')
    .eq('id', id)
    .single()

  if (!school) notFound()

  // For EduTrack we might have students, teachers, subjects/classes.
  const { count: studentCount } = await supabaseAdmin
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', id)
    .is('deleted_at', null)

  const { count: staffCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', id)

  const { count: classCountRes } = await supabaseAdmin
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', id)
  const classCount = classCountRes ?? 0

  const subStatusColor: Record<string, string> = {
    active: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    trial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    suspended: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  }

  const s = school as any
  const countryDetails = getClientCountryDetails(s.country_code)

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Back */}
      <Link href="/admin/schools" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Schools
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{school.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{school.domain || 'No Domain Configured'}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${subStatusColor[s.subscription_status ?? 'trial']}`}>
          {s.subscription_status || 'trial'}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: studentCount ?? 0, Icon: GraduationCap },
          { label: 'Teachers & Staff', value: staffCount ?? 0, Icon: Users },
          { label: 'Classes', value: classCount ?? 0, Icon: BookOpen },
          { label: 'Joined Date', value: new Date(school.created_at!).getFullYear(), Icon: Calendar },
        ].map(({ label, value, Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Grid Layout for Account Details and Manage Client */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-foreground mb-4">Account Details</h2>
          {[
            { label: 'Country', value: <span className="flex items-center gap-2"><span className="text-lg leading-none">{countryDetails.flag}</span> {countryDetails.countryName}</span> },
            { label: 'Currency', value: <span className="font-mono bg-muted/50 px-2 py-0.5 rounded text-xs">{countryDetails.currency}</span> },
            { label: 'Curriculum', value: school.curriculum_type },
            { label: 'Subscription Tier', value: s.subscription_tier || s.subscription_plan },
            { label: 'Status', value: <span className="capitalize">{s.subscription_status || 'trial'}</span> },
            { label: 'Trial Ends', value: s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
            { label: 'Joined', value: new Date(school.created_at!).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-sm font-medium text-foreground flex items-center">{value}</span>
            </div>
          ))}
        </div>

        {/* Manage Client Actions */}
        <ManageClientCard schoolId={id} currentStatus={s.subscription_status || 'trial'} />
      </div>
    </div>
  )
}
