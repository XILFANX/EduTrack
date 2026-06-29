// lib/payments/types.ts
// Payment Provider abstraction — Strategy pattern
// Adding a new country: implement this interface, add to index.ts

export interface PaymentInitiateParams {
  amount: number
  currency: string
  phone?: string           // required for M-Pesa STK Push
  reference: string        // e.g. unit code or invoice ID (must be unique)
  description: string
  callbackUrl?: string
  metadata?: Record<string, string>
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  checkoutRequestId?: string  // M-Pesa STK Push
  checkoutUrl?: string        // Pesapal redirect URL / Paddle checkout URL
  subscriptionId?: string     // Paddle subscription ID if applicable
  error?: string
}

export interface WebhookResult {
  tenantPhone?: string
  amount: number
  reference: string
  transactionCode: string
  paidAt: Date
  isValid: boolean
  rawPayload: unknown
  subscriptionId?: string  // Paddle subscription ID (for subscription lifecycle events)
  eventType?: string       // e.g. 'subscription.activated', 'subscription.canceled'
}

export interface PaymentProvider {
  name: string
  initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult>
  handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult>
  verifyTransaction(transactionId: string): Promise<{ confirmed: boolean; amount?: number }>
}
