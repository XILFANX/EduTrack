import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, full_name, role, phone_number')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/onboarding')

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name, subscription_tier')
    .eq('id', profile.school_id)
    .single()

  const school = schoolRaw as any

  const SETTINGS_SECTIONS = [
    { label: 'School Profile', href: '/dashboard/settings/school', icon: '🏫', desc: 'School name, logo, contact info' },
    { label: 'Subscription & Billing', href: '/dashboard/settings/billing', icon: '💳', desc: 'Manage your EduTrack subscription' },
    { label: 'Notifications', href: '/dashboard/settings/notifications', icon: '🔔', desc: 'Email and SMS preferences' },
    { label: 'Fee Rules', href: '/dashboard/settings/fee-rules', icon: '📋', desc: 'Term dates, grace periods, penalty rate' },
    { label: 'Staff & Access', href: '/dashboard/staff', icon: '👥', desc: 'Manage teachers and support staff' },
    { label: 'Account', href: '/dashboard/settings/account', icon: '⚙️', desc: 'Profile, password, danger zone' },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-32">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{school?.name}</p>
      </div>

      {/* Quick info card */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3 text-sm">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">School Info</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Subscription', value: school?.subscription_tier || 'Trial' },
            { label: 'Your Role', value: profile.role?.replace('_', ' ').toUpperCase() },
          ].map((item) => (
            <div key={item.label} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
              <span className="text-slate-500">{item.label}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{item.value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SETTINGS_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-start gap-3"
          >
            <span className="text-2xl">{section.icon}</span>
            <div>
              <p className="font-medium text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{section.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{section.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
