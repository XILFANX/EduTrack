import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BursarDashboardClient } from './bursar-dashboard-client'

export default async function BursarDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch quick stats for the dashboard
  const [studentsRes, invoicesRes, paymentsRes] = await Promise.all([
    supabase.from('students').select('id, class_id').eq('school_id', profile.school_id).is('deleted_at', null),
    supabase.from('invoices').select('*').eq('school_id', profile.school_id),
    supabase.from('fee_payments').select('amount, payment_date').eq('school_id', profile.school_id)
  ])

  const totalStudents = studentsRes.data?.length || 0
  const invoices = (invoicesRes.data as any[]) || []
  const payments = (paymentsRes.data as any[]) || []

  // Aggregate numbers
  const totalExpected = invoices.reduce((acc: number, inv: any) => acc + Number(inv.amount_due), 0)
  const totalCollected = invoices.reduce((acc: number, inv: any) => acc + Number(inv.amount_paid), 0)
  const outstanding = totalExpected - totalCollected

  const stats = {
    totalStudents,
    totalExpected,
    totalCollected,
    outstanding,
    collectionRate: totalExpected > 0 ? ((totalCollected / totalExpected) * 100).toFixed(1) : '0'
  }

  return (
    <BursarDashboardClient stats={stats} recentPayments={payments.slice(0, 10)} />
  )
}
