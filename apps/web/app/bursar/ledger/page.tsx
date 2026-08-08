import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Receipt, CheckCircle2, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

const fmt = (n: number, currency = 'KES') =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

const STATUS_STYLES: Record<string, string> = {
  open:      'bg-red-100 text-red-700 dark:bg-orange-900/40 dark:text-red-400',
  partial:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  settled:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  overpaid:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const ENTRY_TYPE_LABEL: Record<string, string> = {
  payment:      'Full Payment',
  partial:      'Partial Payment',
  overpayment:  'Overpayment',
  credit_apply: 'Credit Applied',
  correction:   'Correction Entry',
}

export default async function BursarLedgerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // TODO: re-run `npx supabase gen types` after applying migration 20260801000000
  const db = supabase as any

  const { data: obligations } = await db

    .from('obligations')
    .select(`
      id, type, payer_display_ref, period_label, amount_due, balance, currency, status, due_date,
      ledger_entries(id, entry_type, amount, balance_after, created_at)
    `)
    .eq('type', 'fee_term')
    .in('status', ['open', 'partial', 'settled', 'overpaid'])
    .order('due_date', { ascending: false })
    .limit(150)

  const obls = (obligations ?? []) as any[]

  const totalOutstanding = obls.filter((o) => ['open','partial'].includes(o.status))
    .reduce((s: number, o: any) => s + o.balance, 0)
  const totalCollected = obls.filter((o) => ['settled','overpaid'].includes(o.status))
    .reduce((s: number, o: any) => s + o.amount_due, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fee Payment Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Immutable record of all posted fee payments</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
          <p className="text-xs font-medium text-orange-100">Outstanding Fees</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalOutstanding)}</p>
          <p className="text-xs text-orange-100 mt-1">{obls.filter((o) => ['open','partial'].includes(o.status)).length} obligations</p>
        </div>
        <div className="bg-gradient-to-br from-[#1D6FEB] to-[#1558C8] rounded-2xl p-4 text-white">
          <p className="text-xs font-medium text-cyan-100">Collected (this view)</p>
          <p className="text-2xl font-bold mt-1">{fmt(totalCollected)}</p>
          <p className="text-xs text-cyan-100 mt-1">{obls.filter((o) => ['settled','overpaid'].includes(o.status)).length} settled</p>
        </div>
      </div>

      {obls.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No fee obligations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {obls.map((obl: any) => {
            const entries = (obl.ledger_entries ?? []) as any[]
            return (
              <details key={obl.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors list-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${obl.status === 'settled' ? 'bg-blue-500' : obl.status === 'partial' ? 'bg-blue-500' : obl.status === 'overpaid' ? 'bg-blue-500' : 'bg-red-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{obl.payer_display_ref}</p>
                      <p className="text-xs text-muted-foreground">{obl.period_label}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[obl.status]}`}>{obl.status}</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(obl.amount_due, obl.currency)}</p>
                      {obl.balance > 0 && <p className="text-xs text-red-500">−{fmt(obl.balance, obl.currency)}</p>}
                    </div>
                  </div>
                </summary>
                {entries.length > 0 ? (
                  <div className="border-t border-border divide-y divide-border bg-muted/20">
                    {entries.map((le: any) => (
                      <div key={le.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{ENTRY_TYPE_LABEL[le.entry_type] ?? le.entry_type}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(le.created_at).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {' · '}balance after: {fmt(le.balance_after, obl.currency)}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-blue-600">+{fmt(le.amount, obl.currency)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-3 border-t border-border bg-muted/10">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Awaiting matching.
                    </p>
                  </div>
                )}
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
