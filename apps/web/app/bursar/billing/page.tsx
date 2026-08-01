import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency } from '@/lib/utils/formatting'
import { getClientCountryDetails } from '@/lib/utils/country'
import { determineBandForUsage, resolveLocalPrice } from '@edutrack/shared/billing/engine'
import type { PlanBand, PlanBandPrice } from '@edutrack/shared/billing/engine'
import SubscriptionPostPaymentForm from './post-subscription-payment'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Shield,
  AlertTriangle,
  FileText,
  Banknote,
} from 'lucide-react'

export const metadata = {
  title: 'School Subscription Billing — EduTrack',
  description: 'Manage your EduTrack subscription plan and payment history.',
}

export default async function BursarBillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient() as any

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['bursar', 'principal'].includes(profile.role ?? '')) {
    redirect('/bursar/dashboard')
  }

  const { data: school } = await admin
    .from('schools')
    .select('id, name, subscription_status, subscription_plan, trial_ends_at, country_code, active_student_count')
    .eq('id', profile.school_id)
    .single()

  // ── Currency via regional engine (never hardcoded) ────────────────────────
  const countryDetails = getClientCountryDetails(school?.country_code)
  const billingCurrency = countryDetails.currency

  // ── Plan price via plan_band_prices DB rows ──────────────────────────────
  const studentCount = school?.active_student_count ?? 0
  const planName = (school?.subscription_plan ?? 'trial').toLowerCase()

  const { data: allBandsRaw } = await admin
    .from('plan_bands')
    .select('*')
    .eq('product', 'edutrack')
    .order('min_units', { ascending: true })

  const allBands = (allBandsRaw ?? []) as PlanBand[]
  const currentBand = determineBandForUsage(allBands, studentCount)

  let planPrice = 0
  let priceError: string | null = null
  if (currentBand && planName !== 'trial') {
    const { data: bandPriceRow } = await admin
      .from('plan_band_prices')
      .select('*')
      .eq('band_id', currentBand.id)
      .eq('currency_code', billingCurrency)
      .single()

    try {
      planPrice = resolveLocalPrice(bandPriceRow as PlanBandPrice | null, planName, billingCurrency)
    } catch (e: unknown) {
      priceError = e instanceof Error ? e.message : 'Pricing not configured for your region.'
    }
  }

  // ── Open subscription obligations ─────────────────────────────────────────
  const { data: subscriptionObligations } = await admin
    .from('obligations')
    .select('id, amount_due, currency, period_label, status, balance, due_date, created_at')
    .eq('payer_account_id', profile.school_id)
    .eq('type', 'edutrack_subscription')
    .in('status', ['open', 'partial'])
    .order('due_date', { ascending: true })

  // ── Subscription payment history ─────────────────────────────────────────
  const { data: paymentHistory } = await admin
    .from('ledger_entries')
    .select(`
      id,
      amount,
      currency,
      entry_type,
      created_at,
      obligations!inner ( period_label, type )
    `)
    .eq('obligations.type', 'edutrack_subscription')
    .eq('obligations.payer_account_id', profile.school_id)
    .order('created_at', { ascending: false })
    .limit(12)

  const trialEnds   = school?.trial_ends_at ? new Date(school.trial_ends_at) : null
  const daysLeft    = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : 0
  const isActive    = school?.subscription_status === 'active'
  const isTrial     = school?.subscription_status === 'trial'
  const isGrace     = school?.subscription_status === 'grace'
  const isSuspended = school?.subscription_status === 'suspended'

  const StatusIcon = isActive ? CheckCircle2 : isTrial ? Clock : isGrace ? AlertTriangle : XCircle
  const statusColor = isActive    ? 'text-blue-400'
    : isTrial   ? 'text-orange-400'
    : isGrace   ? 'text-orange-400'
    : 'text-blue-400'

  const pendingObligations = (subscriptionObligations ?? []) as Array<{
    id: string; amount_due: number; currency: string; period_label: string
    status: string; balance: number; due_date: string; created_at: string
  }>

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">School Subscription</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage {school?.name ?? 'your school'}&apos;s EduTrack subscription
        </p>
      </div>

      {/* Suspension / Grace Banner */}
      {(isSuspended || isGrace) && (
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${
          isSuspended ? 'bg-blue-500/5 border-blue-500/20' : 'bg-orange-500/5 border-orange-500/20'
        }`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${isSuspended ? 'text-blue-400' : 'text-orange-400'}`} />
          <div>
            <p className={`font-semibold text-sm ${isSuspended ? 'text-blue-400' : 'text-orange-400'}`}>
              {isSuspended ? 'Account Suspended' : 'Grace Period Active'}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isSuspended
                ? 'School access is restricted. Fee ledger data is preserved. Post a subscription payment below to reinstate access.'
                : 'Subscription payment is overdue. Post a payment to avoid suspension. Parent and student portals remain unaffected.'}
            </p>
          </div>
        </div>
      )}

      {priceError && (
        <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-400">Pricing configuration issue</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{priceError}</p>
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className={`relative overflow-hidden rounded-3xl p-6 border ${
        isActive  ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20'
        : isTrial ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20'
        : isGrace ? 'bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20'
        : 'bg-gradient-to-br from-blue-500/10 to-orange-600/5 border-blue-500/20'
      }`}>
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-3xl ${
          isActive ? 'bg-blue-400' : isTrial ? 'bg-blue-400' : isGrace ? 'bg-orange-400' : 'bg-blue-400'
        }`} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isActive ? 'bg-blue-500/20' : isTrial ? 'bg-blue-500/20' : isGrace ? 'bg-orange-500/20' : 'bg-blue-500/20'
            }`}>
              <StatusIcon className={`w-6 h-6 ${statusColor}`} />
            </div>
            <div>
              <p className={`text-xs font-bold uppercase tracking-widest ${statusColor}`}>
                {isActive ? 'Active' : isTrial ? 'Free Trial' : isGrace ? 'Grace Period' : 'Suspended'}
              </p>
              <h2 className="text-2xl font-extrabold text-foreground mt-0.5 capitalize">
                {planName === 'trial' ? 'Trial' : `${planName.charAt(0).toUpperCase()}${planName.slice(1)}`} Plan
              </h2>
              {isTrial && trialEnds && (
                <p className="text-sm text-muted-foreground mt-1">
                  {daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining` : 'Trial ended'}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {countryDetails.flag} {countryDetails.countryName} · {billingCurrency} ·{' '}
                {studentCount} active student{studentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {planPrice > 0 && !priceError && (
            <div className="text-right shrink-0">
              <p className="text-3xl font-extrabold text-foreground tabular-nums">
                {formatCurrency(planPrice, billingCurrency)}
              </p>
              <p className="text-xs text-muted-foreground">per term</p>
            </div>
          )}
        </div>
      </div>

      {/* Post Subscription Payment */}
      {pendingObligations.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Banknote className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Post Subscription Payment</h2>
          </div>
          <div className="p-5 space-y-5">
            <p className="text-sm text-muted-foreground">
              {pendingObligations.length} outstanding subscription obligation{pendingObligations.length > 1 ? 's' : ''}.
              Paste your payment confirmation message to record and verify your payment.
            </p>
            {pendingObligations.map((obl) => (
              <div key={obl.id} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{obl.period_label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Due {new Date(obl.due_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-foreground tabular-nums">
                      {formatCurrency(obl.balance, obl.currency)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                      obl.status === 'partial'
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    }`}>
                      {obl.status === 'partial' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div>
                <SubscriptionPostPaymentForm
                  obligationId={obl.id}
                  amountDue={obl.balance}
                  currency={obl.currency}
                  periodLabel={obl.period_label}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Payment History</h2>
        </div>
        {!paymentHistory || paymentHistory.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No subscription payments recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(paymentHistory as Array<{
              id: string; amount: number; currency: string; entry_type: string; created_at: string
              obligations?: { period_label?: string }
            }>).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(entry.amount, entry.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.obligations?.period_label ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border capitalize ${
                  entry.entry_type === 'payment'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : entry.entry_type === 'partial'
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                }`}>
                  {entry.entry_type === 'payment' ? 'Verified' : entry.entry_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
