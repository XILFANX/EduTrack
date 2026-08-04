import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { FinanceAnalytics } from './finance-client'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ term?: string }>
}

export default async function FinancePage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  const profile = profileRaw as any
  const role = (profile?.role || '').toLowerCase()
  const isAdmin = role.includes('admin') || role.includes('principal') || role.includes('headteacher') || role.includes('bursar')
  if (!profile?.school_id || !isAdmin) redirect('/dashboard')

  const schoolId = profile.school_id
  const adminClient = createAdminClient()

  // Fetch terms + active
  const { data: termsRaw } = await supabase.from('academic_terms').select('id, name, is_active').eq('school_id', schoolId).order('start_date')
  const terms = (termsRaw || []) as any[]
  const activeTerm = terms.find(t => t.is_active) || terms[0]
  const selectedTermId = params.term || activeTerm?.id || ''

  // All invoices for selected term
  const { data: invoicesRaw } = await adminClient
    .from('invoices')
    .select('id, amount, paid, status, discount_amount, student_id, created_at, students(class_id, classes(name))')
    .eq('school_id', schoolId)
    .eq('term_id', selectedTermId)
  const invoices = (invoicesRaw || []) as any[]

  // All fee_payments for selected term
  const { data: paymentsRaw } = await adminClient
    .from('fee_payments')
    .select('amount, paid_at, invoice_id')
    .eq('school_id', schoolId)
    .order('paid_at', { ascending: false })
  const payments = (paymentsRaw || []) as any[]

  // ─── Analytics computations (server-side) ─────────────────────

  // 1. Aggregate stats
  const totalExpected = invoices.reduce((s, i) => s + Number(i.amount) - Number(i.discount_amount || 0), 0)
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paid || 0), 0)
  const totalArrears = Math.max(0, totalExpected - totalCollected)
  const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

  // 2. Collection by class
  const classMap: Record<string, { name: string; expected: number; collected: number }> = {}
  for (const inv of invoices) {
    const className = (inv.students as any)?.classes?.name || 'Unclassified'
    if (!classMap[className]) classMap[className] = { name: className, expected: 0, collected: 0 }
    classMap[className].expected += Number(inv.amount) - Number(inv.discount_amount || 0)
    classMap[className].collected += Number(inv.paid || 0)
  }
  const collectionByClass = Object.values(classMap).sort((a, b) => b.collected - a.collected)

  // 3. Payment trend — last 8 weeks
  const now = new Date()
  const weekBuckets: Record<string, number> = {}
  for (let w = 7; w >= 0; w--) {
    const d = new Date(now)
    d.setDate(d.getDate() - w * 7)
    const key = d.toISOString().slice(0, 10)
    weekBuckets[key] = 0
  }

  for (const p of payments) {
    if (!p.paid_at) continue
    const pDate = new Date(p.paid_at)
    // Find which week bucket this belongs to
    for (let w = 0; w < 8; w++) {
      const bucketStart = new Date(now)
      bucketStart.setDate(bucketStart.getDate() - (7 - w) * 7)
      const bucketEnd = new Date(bucketStart)
      bucketEnd.setDate(bucketEnd.getDate() + 7)
      if (pDate >= bucketStart && pDate < bucketEnd) {
        const key = bucketStart.toISOString().slice(0, 10)
        if (weekBuckets[key] !== undefined) weekBuckets[key] += Number(p.amount)
      }
    }
  }
  const paymentTrend = Object.entries(weekBuckets).map(([date, amount]) => ({
    date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    amount,
  }))

  // 4. Defaulter aging
  const defaulters = invoices
    .filter(i => Number(i.paid || 0) < (Number(i.amount) - Number(i.discount_amount || 0)))
    .map(i => {
      const createdAt = new Date(i.created_at)
      const daysOverdue = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
      return {
        id: i.id,
        className: (i.students as any)?.classes?.name || 'Unclassified',
        outstanding: (Number(i.amount) - Number(i.discount_amount || 0)) - Number(i.paid || 0),
        daysOverdue,
        bucket: daysOverdue <= 30 ? '0–30 days' : daysOverdue <= 60 ? '31–60 days' : '60+ days',
      }
    })

  const agingBuckets = {
    '0–30 days': defaulters.filter(d => d.bucket === '0–30 days'),
    '31–60 days': defaulters.filter(d => d.bucket === '31–60 days'),
    '60+ days': defaulters.filter(d => d.bucket === '60+ days'),
  }

  // 5. Recent payments (last 10)
  const recentPayments = payments.slice(0, 10)

  return (
    <FinanceAnalytics
      stats={{ totalExpected, totalCollected, totalArrears, collectionRate }}
      collectionByClass={collectionByClass}
      paymentTrend={paymentTrend}
      agingBuckets={agingBuckets}
      recentPayments={recentPayments}
      terms={terms}
      selectedTermId={selectedTermId}
    />
  )
}
