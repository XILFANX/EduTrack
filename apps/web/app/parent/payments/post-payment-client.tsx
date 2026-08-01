'use client'

/**
 * EduTrack — Parent: Post Payment (Blind Payer Submission)
 * Mirrors EstateTrack PostPaymentClient with EduTrack-specific copy.
 */

import { useState } from 'react'
import { submitPayerPayment, submitCashPayment } from '@/app/actions/payments/submit-payment'
import { Send, CheckCircle2, Loader2, ShieldOff, CreditCard } from 'lucide-react'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { parseTransactionMessage } from '@/lib/utils/payment-parser'

interface Props {
  obligationId: string
  obligationBalance: number
  periodLabel: string
  currency: string
}

type Mode = 'digital' | 'cash'

const DIGITAL_RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'mobile_money', label: '📱 Mobile Money' },
  { value: 'mpesa_paybill', label: '📱 M-Pesa Paybill' },
  { value: 'mpesa_till', label: '📱 M-Pesa Buy Goods' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'other', label: '💳 Card Payment / Other' },
]

export function ParentPostPaymentClient({ obligationId, obligationBalance, periodLabel, currency }: Props) {
  const [mode, setMode] = useState<Mode>('digital')
  const [rawMessage, setRawMessage] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [parsedAmount, setParsedAmount] = useState('')
  const [parsedFee, setParsedFee] = useState('')
  const [parsedTransactionAt, setParsedTransactionAt] = useState('')
  const [paymentRail, setPaymentRail] = useState<PaymentRail>('mobile_money')
  const [cashAmount, setCashAmount] = useState('')
  const [cashNotes, setCashNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  // Auto-parse SMS using shared parser (§7.0)
  function parseMessage(raw: string) {
    setRawMessage(raw)
    const parsed = parseTransactionMessage(raw)
    if (parsed.referenceCode) setReferenceCode(parsed.referenceCode)
    if (parsed.parsedAmount) setParsedAmount(parsed.parsedAmount.toString())
    if (parsed.parsedFee) setParsedFee(parsed.parsedFee.toString())
    if (parsed.parsedTransactionAt) setParsedTransactionAt(parsed.parsedTransactionAt)
    if (parsed.paymentRail !== 'other') setPaymentRail(parsed.paymentRail)
  }

  async function handleDigitalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!referenceCode.trim()) { setError('Reference code is required.'); return }
    if (!parsedAmount || parseFloat(parsedAmount) <= 0) { setError('Enter the amount from your transaction.'); return }
    setLoading(true); setError(null)
    const res = await submitPayerPayment({
      obligationId, rawMessage: rawMessage || null, referenceCode,
      parsedAmount: parseFloat(parsedAmount), parsedCurrency: currency,
      parsedTransactionAt: parsedTransactionAt || null, 
      parsedFee: parsedFee ? parseFloat(parsedFee) : null,
      paymentRail,
    })
    setLoading(false)
    if (res.error) setError(res.error)
    else setDone(true)
  }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cashAmount || parseFloat(cashAmount) <= 0) { setError('Enter the amount paid.'); return }
    setLoading(true); setError(null)
    const res = await submitCashPayment({
      obligationId, amount: parseFloat(cashAmount),
      currency, method: 'cash', notes: cashNotes || undefined,
    })
    setLoading(false)
    if (res.error) setError(res.error)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-center space-y-2">
        <CheckCircle2 className="w-7 h-7 text-blue-600 mx-auto" />
        <p className="font-bold text-sm text-foreground">Payment Submitted</p>
        <p className="text-xs text-muted-foreground">
          {mode === 'digital'
            ? 'Submitted — you will be notified when the bursar verifies their side.'
            : 'Cash submitted — awaiting bursar confirmation.'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex border border-border rounded-xl overflow-hidden mb-4">
        {(['digital', 'cash'] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null) }}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${mode === m ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
            {m === 'digital' ? '📱 M-Pesa / Bank' : '💵 Cash / Cheque'}
          </button>
        ))}
      </div>

      {mode === 'digital' ? (
        <form onSubmit={handleDigitalSubmit} className="space-y-3">
          <div className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800/50 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700">
            <ShieldOff className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">Paste your own transaction message — what you sent to the school paybill.</p>
          </div>

          {/* Rail */}
          <div className="flex flex-wrap gap-1.5">
            {DIGITAL_RAILS.map((r) => (
              <button key={r.value} type="button" onClick={() => setPaymentRail(r.value)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${paymentRail === r.value ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700' : 'border-border text-muted-foreground'}`}>
                {r.label}
              </button>
            ))}
          </div>

          {/* SMS paste */}
          <textarea rows={2}
            className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
            placeholder="Paste your M-Pesa confirmation message here…"
            value={rawMessage}
            onChange={(e) => parseMessage(e.target.value)} />
          {referenceCode && <p className="text-[11px] text-orange-600">✓ Code: <span className="font-mono font-bold">{referenceCode}</span> · {parsedAmount} {currency}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference *</label>
              <input className="w-full mt-0.5 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="QJK23XF89H" value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value.toUpperCase().trim())} required />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount *</label>
              <input type="number"
                className="w-full mt-0.5 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder={String(obligationBalance)} value={parsedAmount}
                onChange={(e) => setParsedAmount(e.target.value)} required />
            </div>
          </div>

          {error && <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg border border-orange-200">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'Post Payment'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCashSubmit} className="space-y-3">
          <div className="flex gap-2 items-start bg-orange-50 dark:bg-orange-900/20 rounded-xl p-2.5 border border-orange-200 dark:border-orange-800">
            <CreditCard className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-orange-700 dark:text-orange-300">Cash payments require the bursar to confirm on their side.</p>
          </div>

          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Paid ({currency}) *</label>
            <input type="number"
              className="w-full mt-0.5 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder={String(obligationBalance)} value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
            <input className="w-full mt-0.5 bg-muted border border-border rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="e.g. Paid at school reception" value={cashNotes}
              onChange={(e) => setCashNotes(e.target.value)} />
          </div>

          {error && <p className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-lg border border-orange-200">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'Submit Cash Payment'}
          </button>
        </form>
      )}
    </div>
  )
}
