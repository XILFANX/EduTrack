import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceClient } from './finance-client'

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch invoices for the current term (or all active invoices for simplicity)
  const { data: invoicesRaw } = await supabase
    .from('invoices')
    .select('amount, balance')
    .eq('school_id', profile.school_id)
    .is('deleted_at', null)

  const invoices = (invoicesRaw as any[]) || []
  const totalExpected = invoices.reduce((s: number, i: any) => s + Number(i.amount), 0)
  const totalArrears = invoices.reduce((s: number, i: any) => s + Number(i.balance), 0)
  const totalCollected = totalExpected - totalArrears

  // Fetch recent payments for ledger
  const { data: payments } = await supabase
    .from('fee_payments')
    .select('id, amount, mpesa_receipt, payment_method, payment_date, students(first_name, last_name)')
    .eq('school_id', profile.school_id)
    .order('payment_date', { ascending: false })
    .limit(10)

  return (
    <FinanceClient 
      stats={{ totalExpected, totalCollected, totalArrears }}
      payments={payments || []}
    />
  )
}
