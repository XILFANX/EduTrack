import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InvoicesClient } from './invoices-client'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch all invoices with student info
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id,
      amount_due,
      amount_paid,
      status,
      created_at,
      students ( id, first_name, last_name, admission_number )
    `)
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  const invoicesList = (invoices as any[]) || []

  return <InvoicesClient invoices={invoicesList} />
}
