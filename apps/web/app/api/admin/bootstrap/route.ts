// app/api/admin/bootstrap/route.ts
// One-time server bootstrap endpoint for designating the root platform owner.
// Protected by BOOTSTRAP_SECRET env variable — must match exactly.
// Instructions: POST /api/admin/bootstrap with header X-Bootstrap-Secret: <YOUR_SECRET>
// Only functional while PLATFORM_OWNER_EMAIL and BOOTSTRAP_SECRET are set.

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const secret = request.headers.get('x-bootstrap-secret')
  const expectedSecret = process.env.BOOTSTRAP_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ownerEmail = process.env.PLATFORM_OWNER_EMAIL
  if (!ownerEmail) {
    return NextResponse.json(
      { error: 'PLATFORM_OWNER_EMAIL env var not set' },
      { status: 500 }
    )
  }

  // Use service role key — bypasses RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await supabase.rpc('bootstrap_platform_owner', {
    p_email: ownerEmail,
  })

  if (error) {
    console.error('[bootstrap] error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Platform owner bootstrapped: ${ownerEmail}`,
  })
}
