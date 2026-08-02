import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChevronLeft, Receipt, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { ParentPostPaymentClient } from './post-payment-client'

export const dynamic = 'force-dynamic'

const fmt = (n: number, currency = 'KES') =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

export default async function ParentPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, schools(name, currency)')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null
  const currency = (profile.schools as any)?.currency ?? 'KES'

  // TODO: re-run `npx supabase gen types` after applying migration 20260801000000
  const db = supabase as any

  // Load open fee_term obligations for this parent
  const { data: openObls } = await db

    .from('obligations')
    .select('id, payer_display_ref, period_label, amount_due, balance, currency, status, due_date')
    .eq('payer_account_id', user.id)
    .eq('type', 'fee_term')
    .in('status', ['open', 'partial'])
    .order('due_date', { ascending: true })

  // Load paid history
  const { data: historyObls } = await db
    .from('obligations')
    .select('id, payer_display_ref, period_label, amount_due, currency, status')
    .eq('payer_account_id', user.id)
    .eq('type', 'fee_term')
    .in('status', ['settled', 'overpaid'])
    .order('due_date', { ascending: false })
    .limit(20)


  const openList = (openObls ?? []) as any[]
  const historyList = (historyObls ?? []) as any[]
  const totalDue = openList.reduce((s: number, o: any) => s + o.balance, 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/parent/dashboard" className="text-muted-foreground hover:text-foreground text-sm flex items-center">
          <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">School Fees</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit your payment evidence for bursar verification.</p>
      </div>

      {/* Balance card */}
      <div className={`p-6 rounded-3xl shadow-lg ${totalDue > 0
        ? 'bg-gradient-to-br from-blue-500/10 to-orange-600/10 border border-orange-400/20'
        : 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20'}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {totalDue > 0 ? 'Total Outstanding' : 'All Caught Up!'}
        </p>
        <h2 className={`text-4xl font-extrabold tabular-nums ${totalDue > 0 ? 'text-blue-400' : 'text-blue-400'}`}>
          {fmt(totalDue, currency)}
        </h2>
      </div>

      {/* Open obligations */}
      {openList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Outstanding Fees</h3>
          {openList.map((obl: any) => (
            <div key={obl.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">{obl.payer_display_ref}</p>
                  <p className="text-xs text-muted-foreground">
                    {obl.period_label} · Due {new Date(obl.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-bold text-foreground">{fmt(obl.amount_due, obl.currency)}</p>
                  {obl.balance < obl.amount_due && (
                    <p className="text-xs text-blue-500">{fmt(obl.balance, obl.currency)} remaining</p>
                  )}
                </div>
              </div>
              <div className="border-t border-border px-4 py-4 bg-muted/10">
                <ParentPostPaymentClient
                  obligationId={obl.id}
                  obligationBalance={obl.balance}
                  periodLabel={obl.period_label}
                  currency={obl.currency}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {openList.length === 0 && historyList.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-sm font-semibold text-foreground">No fee obligations found</p>
          <p className="text-xs text-muted-foreground mt-1">Check back when your school generates the next term's fees, or contact the bursar if you need to make an advance payment.</p>
        </div>
      )}

      {/* Zero Balance Post Payment Form */}
      {openList.length === 0 && historyList.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="px-4 py-3 bg-muted/20 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Pre-pay Next Term / Advance Payment
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Your balance is zero, but you can still post payments in advance.
            </p>
          </div>
          <div className="px-4 py-4">
            <ParentPostPaymentClient
              obligationId={historyList[0].id}
              obligationBalance={0}
              periodLabel="Advance Payment"
              currency={historyList[0].currency}
            />
          </div>
        </div>
      )}

      {/* Paid history */}
      {historyList.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Paid History</h3>
          {historyList.map((obl: any) => (
            <div key={obl.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{obl.payer_display_ref}</p>
                <p className="text-xs text-muted-foreground">{obl.period_label}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{fmt(obl.amount_due, obl.currency)}</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  {obl.status === 'overpaid' ? 'Overpaid' : 'Paid ✓'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
