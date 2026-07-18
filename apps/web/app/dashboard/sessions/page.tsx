import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SessionsManager } from './sessions-manager'
import { CalendarRange } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SessionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || profile.role !== 'admin') redirect('/dashboard')

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
    <div className="space-y-8 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <CalendarRange className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-foreground">Academic Sessions Engine</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage academic years and terms. Activating a session automatically deactivates previous ones and notifies all staff.
        </p>
      </div>

      <SessionsManager initialYears={years || []} initialTerms={(terms as any) || []} />
    </div>
  )
}
