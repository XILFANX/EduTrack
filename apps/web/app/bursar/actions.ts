'use server'

import { createClient } from '@/lib/supabase/server'

export async function getBursarOverview(schoolId: string) {
  const supabase = await createClient()

  // In a real app we would aggregate, but let's fetch invoices and aggregate manually for now
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('amount, balance, status')
    .eq('school_id', schoolId)
    .is('deleted_at', null)

  if (error) {
    return { expected: 0, collected: 0, arrears: 0, count: 0 }
  }

  let expected = 0
  let arrears = 0

  ;(invoices as any[]).forEach((inv) => {
    expected += inv.amount
    arrears += inv.balance
  })

  const collected = expected - arrears

  return {
    expected,
    collected,
    arrears,
    count: invoices.length,
  }
}
