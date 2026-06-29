import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // 1. Verify this is a valid Daraja callback payload
    const result = data?.Body?.stkCallback
    if (!result) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const resultCode = result.ResultCode
    const checkoutRequestId = result.CheckoutRequestID

    if (resultCode === 0) {
      // Payment Successful
      const items = result.CallbackMetadata.Item
      const amountObj = items.find((i: any) => i.Name === 'Amount')
      const receiptObj = items.find((i: any) => i.Name === 'MpesaReceiptNumber')
      const phoneObj = items.find((i: any) => i.Name === 'PhoneNumber')

      const amount = amountObj?.Value
      const receipt = receiptObj?.Value
      
      const admin = createAdminClient()

      // In a real app we'd map CheckoutRequestID back to the specific invoice.
      // For this implementation, we will log it.
      console.log(`[M-Pesa Webhook] Received KES ${amount} (Receipt: ${receipt}) from ${phoneObj?.Value}`)

      // Update the invoice and insert payment here...
      // (This logic requires the tracking of checkoutRequestId in the DB, 
      // which we will add in the final prod version).
    } else {
      // Payment failed or cancelled
      console.log(`[M-Pesa Webhook] Failed transaction (${resultCode}): ${result.ResultDesc}`)
    }

    // Acknowledge receipt to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
