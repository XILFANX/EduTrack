'use client'

/**
 * SubscriptionPostPaymentForm
 *
 * Used by: landlord (estatetrack_subscription payer), school (edutrack_subscription payer)
 *
 * The payer pastes the transaction confirmation message they received
 * (M-Pesa, bank transfer, etc.) and the engine parses + reconciles it
 * against the platform's blind payee submission.
 *
 * BLINDNESS RULE: This form never shows what the platform received.
 * It only shows the payer what THEY submitted.
 *
 * Currency: always uses obligation.currency (set at obligation creation
 * from the account's regional pricing — never re-derived from country code here).
 */

import { useState, useTransition } from 'react'
import { formatCurrency } from '@/lib/utils/formatting'
import { submitPayerPayment } from '@/app/actions/payments/submit-payment'
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'

interface Props {
  obligationId: string
  amountDue: number
  currency: string
  periodLabel: string
}

import { parseTransactionMessage, formatParsedTimestamp } from '@/lib/utils/payment-parser'
import type { PaymentRail } from '@edutrack/shared/payments/types'

export default function SubscriptionPostPaymentForm({ obligationId, amountDue, currency, periodLabel }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [rawMessage, setRawMessage] = useState('')
  const [referenceCode, setReferenceCode] = useState('')
  const [parsedAmount, setParsedAmount] = useState<string>('')
  const [parsedFee, setParsedFee] = useState('')
  const [parsedTransactionAt, setParsedTransactionAt] = useState('')
  const [parsedCounterparty, setParsedCounterparty] = useState('')
  const [detectedProvider, setDetectedProvider] = useState('')
  const [parsedCurrency, setParsedCurrency] = useState(currency)
  const [paymentRail, setPaymentRail] = useState<PaymentRail>('mobile_money')
  const [showParsed, setShowParsed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<
    | { status: 'success'; submissionId: string; matched: boolean }
    | { status: 'error'; message: string }
    | null
  >(null)

  function handleMessageChange(msg: string) {
    setRawMessage(msg)
    setResult(null)
    if (msg.length > 10) {
      const parsed = parseTransactionMessage(msg)
      if (parsed.referenceCode) setReferenceCode(parsed.referenceCode)
      if (parsed.parsedAmount) setParsedAmount(String(parsed.parsedAmount))
      if (parsed.parsedFee) setParsedFee(String(parsed.parsedFee))
      if (parsed.parsedTransactionAt) setParsedTransactionAt(parsed.parsedTransactionAt)
      if (parsed.parsedCounterparty) setParsedCounterparty(parsed.parsedCounterparty)
      if (parsed.detectedProvider) setDetectedProvider(parsed.detectedProvider)
      if (parsed.paymentRail && parsed.paymentRail !== 'other') setPaymentRail(parsed.paymentRail)
      if (parsed.parsedCurrency) setParsedCurrency(parsed.parsedCurrency)
      setShowParsed(true)
    } else {
      setShowParsed(false)
    }
  }

  function handleSubmit() {
    if (!referenceCode.trim()) return
    const parsed = parseTransactionMessage(rawMessage)
    const amount = parseFloat(parsedAmount) || parsed.parsedAmount || amountDue

    startTransition(async () => {
      const res = await submitPayerPayment({
        obligationId,
        rawMessage: rawMessage || null,
        referenceCode: referenceCode.trim(),
        parsedAmount: amount,
        parsedCurrency,
        parsedTransactionAt: parsedTransactionAt || null,
        parsedCounterparty: parsedCounterparty || null,
        parsedNarration: null,
        parsedFee: parsedFee ? parseFloat(parsedFee) : null,
        paymentRail,
      })

      if ('error' in res && res.error) {
        setResult({ status: 'error', message: res.error })
      } else if ('success' in res && res.success) {
        setResult({ status: 'success', submissionId: res.submissionId!, matched: false })
      }
    })
  }

  function copyRef() {
    navigator.clipboard.writeText(referenceCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setRawMessage('')
    setReferenceCode('')
    setParsedAmount('')
    setShowParsed(false)
    setResult(null)
    setExpanded(false)
  }

  if (result?.status === 'success') {
    return (
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-blue-400 mx-auto" />
        <div>
          <p className="font-bold text-foreground">Payment Submitted</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your payment message has been recorded and is being verified against
            our records. You will be notified once it is confirmed.
          </p>
        </div>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Submit another payment
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Collapse toggle */}
      <button
        id={`post-payment-toggle-${obligationId}`}
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          <Send className="w-3.5 h-3.5" />
          Post a Payment
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* Instruction */}
          <div className="bg-muted/40 rounded-xl p-3 space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              How to post a payment
            </p>
            <p className="text-xs text-muted-foreground">
              After paying, you will receive a confirmation SMS or app notification.
              Paste it below — the system will automatically extract the reference code and amount.
              You can also enter them manually.
            </p>
          </div>

          {/* Obligation summary (read-only — payer knows their own obligation) */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Amount due ({periodLabel})</span>
            <span className="font-bold text-foreground">{formatCurrency(amountDue, currency)}</span>
          </div>

          {/* Raw message paste area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Paste your confirmation message (optional)
            </label>
            <textarea
              id={`raw-message-${obligationId}`}
              value={rawMessage}
              onChange={(e) => handleMessageChange(e.target.value)}
              placeholder={'QJK23XF89H Confirmed. KES 4,500.00 paid to ESTATETRACK on 1/8/26 at 10:30 AM.'}
              rows={3}
              className="w-full bg-background border border-border text-foreground placeholder-muted-foreground/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none transition"
            />
          </div>

          {/* Parsed preview */}
          {showParsed && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">Transaction Details</p>
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

          {/* Manual fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Reference Code <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <input
                  id={`ref-code-${obligationId}`}
                  type="text"
                  value={referenceCode}
                  onChange={(e) => { setReferenceCode(e.target.value.toUpperCase()); setResult(null) }}
                  placeholder="QJK23XF89H"
                  className="w-full bg-background border border-border text-foreground placeholder-muted-foreground/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition pr-10"
                />
                {referenceCode && (
                  <button
                    onClick={copyRef}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Copy reference code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Amount Paid ({currency})
              </label>
              <input
                id={`amount-${obligationId}`}
                type="number"
                value={parsedAmount}
                onChange={(e) => { setParsedAmount(e.target.value); setResult(null) }}
                placeholder={String(amountDue)}
                className="w-full bg-background border border-border text-foreground placeholder-muted-foreground/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>

          {/* Error state */}
          {result?.status === 'error' && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-400">{result.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setExpanded(false); setResult(null) }}
              className="flex-1 sm:flex-none text-sm border border-border text-foreground hover:bg-muted py-2.5 px-4 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              id={`submit-payment-${obligationId}`}
              onClick={handleSubmit}
              disabled={isPending || !referenceCode.trim()}
              className="flex-1 text-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-2.5 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Payment
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-muted-foreground/60">
            Your payment will be verified against our records. Verification usually takes seconds.
            You will receive a notification once confirmed.
          </p>
        </div>
      )}
    </div>
  )
}
