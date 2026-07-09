import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'

export default async function SchoolProfileSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/onboarding')

  const { data: school } = await supabase
    .from('schools')
    .select('name, curriculum_type, address, phone, email')
    .eq('id', profile.school_id)
    .single()

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">School Profile</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <p className="text-slate-500 text-sm">Basic information about your school as registered on EduTrack.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">School Name</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
              {school?.name || '—'}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Curriculum</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground uppercase">
              {school?.curriculum_type || '—'}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
              {school?.phone || '—'}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</label>
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
              {school?.email || '—'}
            </div>
          </div>
          {school?.address && (
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</label>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground">
                {school.address}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 pt-2">
          To update school details, please contact EduTrack support or your system administrator.
        </p>
      </div>
    </div>
  )
}
