import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LedgerClient } from './ledger-client'

export default async function StoreLedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all ledger transactions
  const { data: ledger } = await supabase
    .from('inventory_ledger')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  return <LedgerClient transactions={ledger || []} />
}
