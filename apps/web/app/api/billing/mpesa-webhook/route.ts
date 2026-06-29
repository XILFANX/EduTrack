// app/api/billing/mpesa-webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    console.log('M-Pesa Webhook Payload:', JSON.stringify(payload))

    if (!payload?.Body?.stkCallback) {
      return NextResponse.json({ success: true }) // Ignore invalid payload but return 200 to Daraja
    }

    const callback = payload.Body.stkCallback
    const resultCode = callback.ResultCode
    const checkoutRequestId = callback.CheckoutRequestID

    const admin = createAdminClient()

    // Find the pending transaction
    const { data: tx } = await admin
      .from('platform_transactions')
      .select('id, landlord_id, amount')
      .eq('notes', checkoutRequestId) // We stored it in notes
      .eq('status', 'pending')
      .single()

    if (!tx) {
      console.error('Transaction not found for checkout ID:', checkoutRequestId)
      return NextResponse.json({ success: true }) 
    }

    if (resultCode === 0) {
      // Success
      const items = callback.CallbackMetadata.Item
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || ''
      
      // Update transaction
      await admin
        .from('platform_transactions')
        .update({
          status: 'confirmed',
          mpesa_receipt_number: receipt,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Add 30 days
        })
        .eq('id', tx.id)

      // Update landlord subscription
      await admin
        .from('landlords')
        .update({
          subscription_status: 'active',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Using trial_ends_at for subscription_ends_at
        })
        .eq('id', tx.landlord_id)

      // Notify Landlord
      const { data: landlords } = await admin.from('profiles').select('id').eq('landlord_id', tx.landlord_id).eq('role', 'landlord')
      if (landlords) {
        const { sendNotification } = await import('@/lib/notifications')
        for (const l of landlords) {
          await admin.from('notifications').insert({
            profile_id: l.id,
            title: 'Payment Confirmed',
            message: `Your subscription payment of KES ${tx.amount || ''} was successful (Receipt: ${receipt}).`,
            type: 'billing_receipt',
            link: '/settings/billing'
          })
          await sendNotification(l.id, {
            title: 'Payment Confirmed',
            body: `Your subscription payment was successful.`,
            data: { url: '/settings/billing' }
          })
        }
      }

    } else {
      // Failed
      await admin
        .from('platform_transactions')
        .update({
          status: 'failed',
          notes: `${checkoutRequestId} - ${callback.ResultDesc}`
        })
        .eq('id', tx.id)
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Success"
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Internal Server Error"
    })
  }
}
