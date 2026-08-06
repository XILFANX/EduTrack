import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils/formatting'
import { recordManualResolutionPair } from '@/app/actions/payments/corridors'
import { revalidatePath } from 'next/cache'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react'

/**
 * DisputeQueue — Server Component (EduTrack Bursar)
 *
 * Shows open dispute cases for this school's obligations (fee obligations only).
 * Bursar can confirm or dismiss. Same logic as EstateTrack landlord dispute queue
 * but scoped to edutrack payee_account_id = school_id.
 */

async function resolveDispute(disputeId: string) {
  'use server'
  await recordManualResolutionPair(disputeId)
  const admin = createAdminClient() as any
  await admin
    .from('dispute_cases')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', disputeId)
  const { data: dispute } = await admin
    .from('dispute_cases')
    .select('payer_submission_id, payee_submission_id, obligation_id')
    .eq('id', disputeId)
    .single()
  if (dispute) {
    const ids = [dispute.payer_submission_id, dispute.payee_submission_id].filter(Boolean)
    if (ids.length > 0) {
      await admin.from('submissions')
        .update({ status: 'matched', matched_at: new Date().toISOString() })
        .in('id', ids)
    }
    await admin.rpc('refresh_obligation_status', { p_obligation_id: dispute.obligation_id })
  }
  revalidatePath('/bursar/invoices')
}

async function dismissDispute(disputeId: string) {
  'use server'
  const admin = createAdminClient() as any
  await admin
    .from('dispute_cases')
    .update({ status: 'dismissed' })
    .eq('id', disputeId)
  revalidatePath('/bursar/invoices')
}

interface DisputeRow {
  id: string
  origin: string
  status: string
  created_at: string
  payer_submission: { reference_code: string; payment_rail: string; parsed_amount: number; parsed_currency: string } | null
  payee_submission: { reference_code: string; payment_rail: string; parsed_amount: number; parsed_currency: string } | null
  obligations: { period_label: string; currency: string } | null
}

export default async function DisputeQueue({ schoolId }: { schoolId: string }) {
  const admin = createAdminClient() as any

  const { data: disputes } = await admin
    .from('dispute_cases')
    .select(`
      id,
      origin,
      status,
      created_at,
      payer_submission:submissions!dispute_cases_payer_submission_id_fkey(
        reference_code, payment_rail, parsed_amount, parsed_currency
      ),
      payee_submission:submissions!dispute_cases_payee_submission_id_fkey(
        reference_code, payment_rail, parsed_amount, parsed_currency
      ),
      obligations!inner ( period_label, currency, payee_account_id )
    `)
    .eq('obligations.payee_account_id', schoolId)
    .eq('status', 'open')
    .order('created_at', { ascending: true })
    .limit(20)

  const rows = (disputes ?? []) as DisputeRow[]
  if (rows.length === 0) return null

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h2 className="text-base font-bold text-foreground">Disputes Awaiting Review</h2>
        <span className="ml-auto text-xs bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
          {rows.length} open
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        These fee payment pairs could not be auto-verified. Confirm or dismiss each one.
      </p>

      <div className="space-y-3">
        {rows.map((d) => {
          const payerAmount = d.payer_submission?.parsed_amount ?? 0
          const payeeAmount = d.payee_submission?.parsed_amount ?? 0
          const currency = d.payer_submission?.parsed_currency ?? d.obligations?.currency ?? 'KES'
          const amountMatch = Math.abs(payerAmount - payeeAmount) < 1
          const codeMatch = d.payer_submission?.reference_code === d.payee_submission?.reference_code

          return (
            <div key={d.id} className="bg-card border border-orange-500/20 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {d.obligations?.period_label ?? 'Unknown period'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {d.origin === 'flagged_pair' ? 'Signal disagreement' : 'No school submission found within window'}
                    {' · '}
                    {new Date(d.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full font-semibold capitalize">
                  {d.origin === 'flagged_pair' ? 'Flagged' : 'Timeout'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide">Parent/Student claimed</p>
                  <p className="font-mono text-foreground">{d.payer_submission?.reference_code ?? '—'}</p>
                  <p className="text-foreground">{formatCurrency(payerAmount, currency)}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-3 space-y-1">
                  <p className="font-semibold text-muted-foreground uppercase tracking-wide">School received</p>
                  <p className="font-mono text-foreground">{d.payee_submission?.reference_code ?? '—'}</p>
                  <p className="text-foreground">
                    {d.payee_submission ? formatCurrency(payeeAmount, currency) : 'No submission yet'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  codeMatch ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                }`}>
                  Code: {codeMatch ? '✓' : '✗'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                  amountMatch ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                }`}>
                  Amount: {amountMatch ? '✓' : `${formatCurrency(payerAmount, currency)} vs ${formatCurrency(payeeAmount, currency)}`}
                </span>
              </div>

              <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Confirm Match</strong> if these describe the same transaction.
                  This updates the payment corridor model. <strong className="text-foreground">Dismiss</strong> to keep unresolved for follow-up.
                </p>
              </div>

              <div className="flex gap-3">
                <form action={async () => { 'use server'; await dismissDispute(d.id) }}>
                  <button
                    type="submit"
                    className="text-sm border border-border text-muted-foreground hover:text-foreground hover:border-cyan-400 py-2 px-4 rounded-xl font-medium transition-colors"
                  >
                    Dismiss
                  </button>
                </form>
                <form action={async () => { 'use server'; await resolveDispute(d.id) }} className="flex-1">
                  <button
                    id={`confirm-dispute-${d.id}`}
                    type="submit"
                    className="w-full text-sm bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Match
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
