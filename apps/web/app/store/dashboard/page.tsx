import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StoreDashboardClient } from './store-dashboard-client'

export default async function StoreDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return null

  // Fetch recent ledger transactions
  const { data: ledger } = await supabase
    .from('inventory_ledger')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Aggregate current stock loosely (in a real app we'd have a separate items table)
  const allTx = await supabase
    .from('inventory_ledger')
    .select('item_name, quantity, transaction_type')
    .eq('school_id', profile.school_id)
  
  const stockMap = new Map<string, number>()
  if (allTx.data) {
    allTx.data.forEach(tx => {
      const current = stockMap.get(tx.item_name) || 0
      if (tx.transaction_type === 'in') stockMap.set(tx.item_name, current + tx.quantity)
      if (tx.transaction_type === 'out') stockMap.set(tx.item_name, current - tx.quantity)
    })
  }

  const stock = Array.from(stockMap.entries()).map(([name, qty]) => ({ name, qty }))

  return (
    <StoreDashboardClient 
      recentTransactions={ledger || []} 
      currentStock={stock} 
      schoolId={profile.school_id}
      userId={user.id}
    />
  )
}
