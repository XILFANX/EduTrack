// app/api/billing/mpesa-status/[checkoutId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: Promise<{ checkoutId: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Use user-level client to ensure RLS applies, but we just check the status
    // Wait, platform_transactions has RLS. Landlord can see their own.
    const { checkoutId } = await params

    const { data: tx } = await supabase
      .from('platform_transactions')
      .select('status, mpesa_receipt_number, notes')
      .eq('notes', checkoutId)
      .single()

    if (!tx) {
      return NextResponse.json({ status: 'pending' }) // If not found, assume it's pending or not synced yet
    }

    if (tx.status === 'confirmed') {
      return NextResponse.json({ status: 'success', receiptNumber: tx.mpesa_receipt_number })
    } else if (tx.status === 'failed') {
      return NextResponse.json({ status: 'failed', resultDesc: tx.notes })
    }

    return NextResponse.json({ status: 'pending' })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
