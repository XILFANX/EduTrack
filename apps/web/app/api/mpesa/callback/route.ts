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

      const { data, error: stkErr } = await admin
        .from('mpesa_stk_requests')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single()

      const stkRequest = data as any

      if (stkRequest) {
        // Mark as completed
        await admin.from('mpesa_stk_requests')
          .update({ status: 'Completed' })
          .eq('id', stkRequest.id)

        // 1. Get current invoice balance
        const { data: invData } = await admin
          .from('invoices')
          .select('balance, amount')
          .eq('id', stkRequest.invoice_id)
          .single()

        const invoiceRaw = invData as any

        if (invoiceRaw) {
          // 2. Insert payment record
          await admin.from('fee_payments').insert({
            school_id: stkRequest.school_id,
            invoice_id: stkRequest.invoice_id,
            student_id: stkRequest.student_id,
            amount: amount,
            payment_method: 'M-Pesa',
            mpesa_receipt: receipt,
          })

          // 3. Update invoice balance
          const newBalance = invoiceRaw.balance - amount
          const newStatus = newBalance <= 0 ? 'paid' : newBalance === invoiceRaw.amount ? 'unpaid' : 'partial'

          await admin
            .from('invoices')
            .update({ balance: newBalance, status: newStatus })
            .eq('id', stkRequest.invoice_id)
            
          console.log(`[M-Pesa Webhook] Reconciled KES ${amount} for invoice ${stkRequest.invoice_id}`)
        }
      } else {
        console.log(`[M-Pesa Webhook] STK Request not found for CheckoutRequestID: ${checkoutRequestId}`)
      }
    } else {
      // Payment failed or cancelled
      console.log(`[M-Pesa Webhook] Failed transaction (${resultCode}): ${result.ResultDesc}`)
      
      const admin = createAdminClient()
      await admin.from('mpesa_stk_requests')
        .update({ status: 'Failed' })
        .eq('checkout_request_id', checkoutRequestId)
    }

    // Acknowledge receipt to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
