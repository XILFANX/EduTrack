// lib/payments/paddle.ts
// Paddle Billing provider — International subscriptions (Merchant of Record)
// Handles: recurring billing, multi-currency, auto VAT/Sales Tax compliance
// Docs: https://developer.paddle.com

import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk'
import type { PaymentProvider, PaymentInitiateParams, PaymentResult, WebhookResult } from './types'

function getPaddleClient(): Paddle {
  const env =
    process.env.PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox
  return new Paddle(process.env.PADDLE_API_KEY!, { environment: env, logLevel: LogLevel.error })
}

export const paddleProvider: PaymentProvider = {
  name: 'paddle',

  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult> {
    try {
      const paddle = getPaddleClient()

      // Create a transaction with a non-catalog price — Paddle returns a checkout URL
      const txRes = await paddle.transactions.create({
        items: [
          {
            price: {
              description: params.description,
              unitPrice: {
                amount: String(Math.round(params.amount * 100)), // smallest unit
                currencyCode: params.currency.toUpperCase() as 'USD' | 'EUR' | 'GBP',
              },
              taxMode: 'account_setting',
              quantity: { minimum: 1, maximum: 1 },
              // product is required when productId is not provided
              product: {
                name: params.description,
                taxCategory: 'saas',
              },
            },
            quantity: 1,
          },
        ],
        customData: { reference: params.reference, ...params.metadata } as Record<string, unknown>,
        checkout: {
          url: params.callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
        },
      })

      const checkoutUrl = txRes.checkout?.url ?? undefined
      return {
        success: true,
        transactionId: txRes.id,
        checkoutUrl,
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  },

  async handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult> {
    try {
      const paddle = getPaddleClient()
      const secret = process.env.PADDLE_WEBHOOK_SECRET!

      // unmarshal is async — must be awaited
      const event = await paddle.webhooks.unmarshal(
        payload as string,
        secret,
        signature ?? '',
      )

      if (!event) {
        return { isValid: false, amount: 0, reference: '', transactionCode: '', paidAt: new Date(), rawPayload: payload }
      }

      if (event.eventType === 'transaction.completed') {
        const tx = event.data as unknown as Record<string, unknown>
        const details = tx.details as Record<string, unknown> | undefined
        const totals = details?.totals as Record<string, unknown> | undefined
        const amount = totals?.total ? Number(totals.total) / 100 : 0
        const customData = tx.customData as Record<string, string> | undefined

        return {
          isValid: true,
          amount,
          transactionCode: tx.id as string,
          reference: customData?.reference ?? '',
          paidAt: new Date(),
          rawPayload: payload,
          subscriptionId: tx.subscriptionId as string | undefined,
        }
      }

      if (
        event.eventType === 'subscription.activated' ||
        event.eventType === 'subscription.updated' ||
        event.eventType === 'subscription.canceled'
      ) {
        const sub = event.data as unknown as Record<string, unknown>
        return {
          isValid: true,
          amount: 0,
          transactionCode: '',
          reference: '',
          paidAt: new Date(),
          rawPayload: payload,
          subscriptionId: sub.id as string,
          eventType: event.eventType,
        }
      }

      return { isValid: false, amount: 0, reference: '', transactionCode: '', paidAt: new Date(), rawPayload: payload }
    } catch (err) {
      console.error('[paddle-provider] webhook error:', err)
      return { isValid: false, amount: 0, reference: '', transactionCode: '', paidAt: new Date(), rawPayload: payload }
    }
  },

  async verifyTransaction(transactionId: string): Promise<{ confirmed: boolean; amount?: number }> {
    try {
      const paddle = getPaddleClient()
      const tx = await paddle.transactions.get(transactionId)
      const totals = (tx.details?.totals as Record<string, unknown> | undefined)
      const amount = totals?.total ? Number(totals.total) / 100 : undefined
      return { confirmed: tx.status === 'completed', amount }
    } catch {
      return { confirmed: false }
    }
  },
}
