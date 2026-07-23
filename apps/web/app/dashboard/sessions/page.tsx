import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionsManager } from './sessions-manager'
import { CalendarRange } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) redirect('/dashboard')

  const role = (profile.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  // Fetch all years
  const { data: years } = await supabase
    .from('academic_years')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('start_date', { ascending: false })

  // Fetch all terms
  const { data: terms } = await supabase
    .from('academic_terms')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('start_date', { ascending: true })

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
          <CalendarRange className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Academic Sessions Engine</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage academic years and terms. Activating a session notifies all staff automatically.
          </p>
        </div>
      </div>

      <SessionsManager 
        initialYears={JSON.parse(JSON.stringify(years || []))} 
        initialTerms={JSON.parse(JSON.stringify(terms || []))} 
      />
    </div>
  )
}
