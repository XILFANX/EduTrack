// app/api/billing/mpesa-stk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PLAN_PRICES_KES: Record<string, number> = {
  starter: 2000,
  growth: 4500,
  business: 8000,
}

// Ensure you have these in your .env
// DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET, DARAJA_PASSKEY, DARAJA_SHORTCODE
// For sandbox, use: https://sandbox.safaricom.co.ke
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.safaricom.co.ke' 
  : 'https://sandbox.safaricom.co.ke';

async function getAccessToken() {
  const consumerKey = process.env.DARAJA_CONSUMER_KEY || 'mock_key'
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET || 'mock_secret'
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  })
  
  if (!res.ok) {
    if (process.env.NODE_ENV !== 'production') return 'mock_token';
    throw new Error('Failed to get M-Pesa access token')
  }
  const data = await res.json()
  return data.access_token
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { phone } = await req.json()
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Standardize phone to 254...
    let formattedPhone = phone.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1)
    } else if (formattedPhone.startsWith('254')) {
      // already good
    } else {
      formattedPhone = '254' + formattedPhone
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('landlord_id')
      .eq('id', user.id)
      .single()

    if (!profile?.landlord_id) {
      return NextResponse.json({ error: 'No landlord profile found' }, { status: 404 })
    }

    const admin = createAdminClient()
    const { data: landlord } = await admin
      .from('landlords')
      .select('subscription_plan')
      .eq('id', profile.landlord_id)
      .single()

    const plan = landlord?.subscription_plan || 'starter'
    const amount = PLAN_PRICES_KES[plan] || 2000

    // Initiate STK Push
    const token = await getAccessToken()
    const shortcode = process.env.DARAJA_SHORTCODE || '174379'
    const passkey = process.env.DARAJA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
    
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/mpesa-webhook`

    const stkBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `Sub-${profile.landlord_id.slice(0,8).toUpperCase()}`,
      TransactionDesc: `EstateTrack ${plan} Plan`
    }

    // In a real environment without keys, we mock the success
    let checkoutRequestId = `ws_CO_${Date.now()}`
    
    if (process.env.DARAJA_CONSUMER_KEY) {
      const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(stkBody)
      })

      const data = await res.json()
      if (!res.ok || data.ResponseCode !== '0') {
        console.error('STK Push failed:', data)
        return NextResponse.json({ error: data.errorMessage || 'Failed to send STK push' }, { status: 500 })
      }
      checkoutRequestId = data.CheckoutRequestID
    }

    // Save pending transaction
    const { error: txError } = await admin
      .from('platform_transactions')
      .insert({
        landlord_id: profile.landlord_id,
        amount,
        currency: 'KES',
        payment_method: 'mpesa_stk',
        status: 'pending',
        notes: checkoutRequestId // We store the checkout request ID here to match webhook
      })

    if (txError) {
      console.error('Tx save error:', txError)
      return NextResponse.json({ error: 'Failed to create transaction record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, checkoutRequestId })
  } catch (err: any) {
    console.error('STK error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
