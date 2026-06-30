import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function StoreLedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users').select('school_id').eq('id', user.id).single()
  const profile = profileResult as any
  if (!profile?.school_id) return null

  const { data: ledger } = await supabase
    .from('inventory_ledger')
    .select('*, users!inventory_ledger_recorded_by_fkey(full_name)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">A complete log of all stock movements.</p>
      </div>

      {!ledger || ledger.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No ledger entries yet. Log some stock to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ledger.map((entry: any) => {
            const isIn = entry.quantity_change > 0
            return (
              <Card key={entry.id} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIn ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {isIn ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{entry.item_name}</h3>
                      <p className="text-xs text-muted-foreground">
                        By {(entry.users as any)?.full_name || 'System'} · {formatDate(entry.created_at)}
                      </p>
                      {entry.notes && <p className="text-xs text-slate-400 italic mt-0.5">{entry.notes}</p>}
                    </div>
                  </div>
                  <div className={`text-lg font-bold ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isIn ? '+' : ''}{entry.quantity_change}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
