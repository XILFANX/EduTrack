import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { SchoolSettingsClient } from './school-settings-client'

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

  const { data: schoolRaw } = await supabase
    .from('schools')
    .select('name, address, logo_url')
    .eq('id', profile.school_id)
    .single()

  const school = schoolRaw as any

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto pb-32">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">School Profile</h1>
      </div>

      <SchoolSettingsClient school={school} />
    </div>
  )
}
