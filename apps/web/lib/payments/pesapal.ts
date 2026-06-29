// lib/payments/pesapal.ts
// Pesapal v3 provider — Kenya subscription & hosted checkout billing
// Supports: M-Pesa, Airtel Money, local Visa/Mastercard (KES)
// Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/introduction

import type { PaymentProvider, PaymentInitiateParams, PaymentResult, WebhookResult } from './types'

const SANDBOX_BASE = 'https://cybqa.pesapal.com/pesapalv3'
const PRODUCTION_BASE = 'https://pay.pesapal.com/v3'

function getBase(): string {
  return process.env.PESAPAL_ENV === 'production' ? PRODUCTION_BASE : SANDBOX_BASE
}

// ----- Token cache (5-minute TTL as per Pesapal docs) -----
let _cachedToken: string | null = null
let _tokenExpiry = 0

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken

  const res = await fetch(`${getBase()}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY!,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET!,
    }),
  })

  if (!res.ok) throw new Error(`Pesapal auth failed: ${res.status}`)
  const data = await res.json()
  _cachedToken = data.token as string
  _tokenExpiry = Date.now() + 4.5 * 60 * 1000 // refresh at 4m30s (token valid 5m)
  return _cachedToken!
}

// ----- Register IPN URL once and cache the notification_id -----
let _notificationId: string | null = null

async function getNotificationId(token: string): Promise<string> {
  if (_notificationId) return _notificationId

  const ipnUrl = process.env.PESAPAL_IPN_URL!
  const res = await fetch(`${getBase()}/api/URLSetup/RegisterIPN`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: ipnUrl,
      ipn_notification_type: 'POST',
    }),
  })

  if (!res.ok) throw new Error(`Pesapal IPN registration failed: ${res.status}`)
  const data = await res.json()
  _notificationId = data.ipn_id as string
  return _notificationId!
}

export const pesapalProvider: PaymentProvider = {
  name: 'pesapal',

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult> {
    try {
      const token = await getAccessToken()
      const notificationId = await getNotificationId(token)

      const res = await fetch(`${getBase()}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: params.reference,                        // unique merchant reference
          currency: params.currency,
          amount: params.amount,
          description: params.description,
          callback_url: params.callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
          notification_id: notificationId,
          billing_address: {
            phone_number: params.phone ?? undefined,
            ...(params.metadata?.email ? { email_address: params.metadata.email } : {}),
            ...(params.metadata?.name ? { first_name: params.metadata.name.split(' ')[0], last_name: params.metadata.name.split(' ').slice(1).join(' ') } : {}),
          },
        }),
      })

      if (!res.ok) throw new Error(`Pesapal order failed: ${res.status}`)
      const data = await res.json()

      return {
        success: true,
        transactionId: data.order_tracking_id as string,
        checkoutUrl: data.redirect_url as string,
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  },

  async handleWebhook(payload: unknown): Promise<WebhookResult> {
    // Pesapal sends OrderTrackingId in the IPN body (POST) or query string (GET)
    const body = payload as Record<string, string>
    const orderTrackingId = body?.OrderTrackingId ?? body?.orderTrackingId

    if (!orderTrackingId) {
      return { isValid: false, amount: 0, reference: '', transactionCode: '', paidAt: new Date(), rawPayload: payload }
    }

    const result = await this.verifyTransaction(orderTrackingId)
    return {
      isValid: result.confirmed,
      amount: result.amount ?? 0,
      transactionCode: orderTrackingId,
      reference: body?.OrderMerchantReference ?? '',
      paidAt: new Date(),
      rawPayload: payload,
    }
  },

  async verifyTransaction(orderTrackingId: string): Promise<{ confirmed: boolean; amount?: number }> {
    try {
      const token = await getAccessToken()
      const res = await fetch(
        `${getBase()}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
        { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) return { confirmed: false }
      const data = await res.json()
      // payment_status_code 1 = completed
      return {
        confirmed: data.payment_status_code === 1,
        amount: data.amount as number | undefined,
      }
    } catch {
      return { confirmed: false }
    }
  },
}
