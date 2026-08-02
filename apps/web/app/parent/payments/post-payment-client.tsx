'use client'

/**
 * EduTrack — Parent: Post Fees Payment (Blind Payer Submission)
 *
 * Title: "Post Fees Payment"
 * No blind-verification banner — parent just pastes their transaction message.
 * Submit phases: Submit → Submitting... → Payment Posted
 * Transaction Details card shown after auto-parse.
 * Blue theme (EduTrack brand).
 */

import { useState } from 'react'
import { submitPayerPayment, submitCashPayment } from '@/app/actions/payments/submit-payment'
import { Send, CheckCircle2, Loader2, CreditCard } from 'lucide-react'
import type { PaymentRail } from '@edutrack/shared/payments/types'
import { parseTransactionMessage, formatParsedTimestamp } from '@/lib/utils/payment-parser'

interface Props {
  obligationId: string
  obligationBalance: number
  periodLabel: string
  currency: string
}

type Mode = 'digital' | 'cash'
type Phase = 'idle' | 'submitting' | 'done'

const DIGITAL_RAILS: { value: PaymentRail; label: string }[] = [
  { value: 'mobile_money', label: '📱 Mobile Money' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer' },
  { value: 'crypto', label: '₿ Crypto' },
  { value: 'other', label: '💳 Other' },
]

export function ParentPostPaymentClient({ obligationId, obligationBalance, periodLabel, currency }: Props) {
  const [mode, setMode] = useState<Mode>('digital')
  const [rawMessage, setRawMessage] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [parsedAmount, setParsedAmount] = useState('')
  const [parsedFee, setParsedFee] = useState('')
  const [parsedTransactionAt, setParsedTransactionAt] = useState('')
  const [parsedCounterparty, setParsedCounterparty] = useState('')
  const [detectedProvider, setDetectedProvider] = useState('')
  const [paymentRail, setPaymentRail] = useState<PaymentRail>('mobile_money')
  const [parsedCurrency, setParsedCurrency] = useState(currency)
  const [cashAmount, setCashAmount] = useState('')
  const [cashNotes, setCashNotes] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)

  function parseMessage(raw: string) {
    setRawMessage(raw)
    const parsed = parseTransactionMessage(raw)
    if (parsed.referenceCode) setReferenceCode(parsed.referenceCode)
    if (parsed.parsedAmount) setParsedAmount(parsed.parsedAmount.toString())
    if (parsed.parsedFee) setParsedFee(parsed.parsedFee.toString())
    if (parsed.parsedTransactionAt) setParsedTransactionAt(parsed.parsedTransactionAt)
    if (parsed.parsedCounterparty) setParsedCounterparty(parsed.parsedCounterparty)
    if (parsed.detectedProvider) setDetectedProvider(parsed.detectedProvider)
    if (parsed.paymentRail !== 'other') setPaymentRail(parsed.paymentRail)
    if (parsed.parsedCurrency) setParsedCurrency(parsed.parsedCurrency)
  }

  async function handleDigitalSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!referenceCode.trim()) { setError('Reference code is required.'); return }
    if (!parsedAmount || parseFloat(parsedAmount) <= 0) { setError('Enter the amount you paid.'); return }

    setPhase('submitting')
    setError(null)

    const res = await submitPayerPayment({
      obligationId,
      rawMessage: rawMessage || null,
      referenceCode,
      parsedAmount: parseFloat(parsedAmount),
      parsedCurrency,
      parsedTransactionAt: parsedTransactionAt || null,
      parsedCounterparty: parsedCounterparty || null,
      parsedFee: parsedFee ? parseFloat(parsedFee) : null,
      paymentRail,
    })

    if (res.error) { setError(res.error); setPhase('idle') }
    else setPhase('done')
  }

  async function handleCashSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cashAmount || parseFloat(cashAmount) <= 0) { setError('Enter the amount paid.'); return }

    setPhase('submitting')
    setError(null)

    const res = await submitCashPayment({
      obligationId,
      amount: parseFloat(cashAmount),
      currency,
      method: 'cash',
      notes: cashNotes || undefined,
    })

    if (res.error) { setError(res.error); setPhase('idle') }
    else setPhase('done')
  }

  if (phase === 'done') {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-blue-600" />
        </div>
        <p className="font-bold text-foreground">Payment Posted</p>
        <p className="text-sm text-muted-foreground">
          {mode === 'digital'
            ? 'Your payment has been submitted and is awaiting verification. You will be notified once it is confirmed.'
            : 'Your cash payment has been recorded and sent to the school for confirmation.'}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-500" />
          Post Fees Payment — {periodLabel}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Balance: {fmt(obligationBalance)}</p>
      </div>

      <div className="flex border-b border-border">
        {(['digital', 'cash'] as Mode[]).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null) }}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              mode === m
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-b-2 border-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            {m === 'digital' ? '📱 Digital / Bank' : '💵 Cash / Cheque'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'digital' ? (
          <form onSubmit={handleDigitalSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Paste the exact confirmation message you received. The system will automatically extract the reference code and amount.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Channel</label>
              <div className="flex flex-wrap gap-2">
                {DIGITAL_RAILS.map((r) => (
                  <button key={r.value} type="button" onClick={() => setPaymentRail(r.value)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      paymentRail === r.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700'
                        : 'border-border text-muted-foreground hover:border-blue-300'
                    }`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction Message</label>
              <textarea rows={3}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                placeholder="Paste your confirmation SMS or bank alert here…"
                value={rawMessage}
                onChange={(e) => parseMessage(e.target.value)}
              />

              {rawMessage && (detectedProvider || referenceCode || parsedAmount) && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Transaction Details</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {detectedProvider && <><span className="text-muted-foreground">Provider</span><span className="font-medium text-foreground">{detectedProvider}</span></>}
                    {referenceCode && <><span className="text-muted-foreground">Reference</span><span className="font-mono font-bold text-foreground">{referenceCode}</span></>}
                    {parsedAmount && <><span className="text-muted-foreground">Amount</span><span className="font-semibold text-foreground">{parsedCurrency} {parseFloat(parsedAmount).toLocaleString()}</span></>}
                    {parsedFee && <><span className="text-muted-foreground">Transaction Fee</span><span className="text-foreground">{parsedCurrency} {parseFloat(parsedFee).toLocaleString()}</span></>}
                    {parsedTransactionAt && <><span className="text-muted-foreground">Date / Time</span><span className="text-foreground">{formatParsedTimestamp(parsedTransactionAt) || parsedTransactionAt}</span></>}
                    {parsedCounterparty && <><span className="text-muted-foreground">To</span><span className="italic text-foreground">{parsedCounterparty}</span></>}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reference Code *</label>
                <input className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="QJK23XF89H" value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value.toUpperCase().trim())} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Sent ({parsedCurrency}) *</label>
                <input type="number" className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="15000" value={parsedAmount}
                  onChange={(e) => setParsedAmount(e.target.value)} required />
              </div>
            </div>

            {error && <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-xl border border-orange-200">{error}</p>}

            <button type="submit" disabled={phase === 'submitting'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
              {phase === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {phase === 'submitting' ? 'Submitting...' : 'Post Payment'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCashSubmit} className="space-y-4">
            <div className="flex gap-2 items-start bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
              <CreditCard className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
              <p className="text-[11px] text-orange-700 dark:text-orange-300">
                Cash and cheque payments require the school to confirm on their side. You'll be notified once confirmed.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount Paid ({currency}) *</label>
              <input type="number" className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder={String(obligationBalance)} value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
              <input className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="e.g. Cash handed to bursar's office on 1 Aug" value={cashNotes}
                onChange={(e) => setCashNotes(e.target.value)} />
            </div>

            {error && <p className="text-sm text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-3 py-2 rounded-xl border border-orange-200">{error}</p>}

            <button type="submit" disabled={phase === 'submitting'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
              {phase === 'submitting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {phase === 'submitting' ? 'Submitting...' : 'Post Cash Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
