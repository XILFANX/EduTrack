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
  const schoolId = profile.school_id

  const [
    { data: invoicesData },
    { data: termsData },
    { data: classesData },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select(`
        id, amount, balance, status, due_date, created_at,
        students(id, first_name, last_name, admission_number, classes(name)),
        academic_terms(name),
        invoice_items(description, amount),
        fee_payments(id, amount, payment_method, mpesa_receipt, payment_date)
      `)
      .eq('school_id', schoolId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('academic_terms')
      .select('id, name, is_active')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)
      .order('name'),
  ])

  return (
    <InvoicesClient
      schoolId={schoolId}
      invoices={(invoicesData as any[]) || []}
      terms={(termsData as any[]) || []}
      classes={(classesData as any[]) || []}
    />
  )
}

