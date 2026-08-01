import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Simple cron authentication (e.g. Vercel Cron header or internal API key)
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient() as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Find unmatched payee submissions older than 30 days
  const { data: expiredSubmissions, error: fetchErr } = await admin
    .from('submissions')
    .select('id, submitter_id')
    .eq('submitter_role', 'payee')
    .eq('status', 'unmatched')
    .lt('created_at', thirtyDaysAgo)

  if (fetchErr) {
    return NextResponse.json({ error: 'Failed to fetch stale submissions', details: fetchErr.message }, { status: 500 })
  }

  if (!expiredSubmissions || expiredSubmissions.length === 0) {
    return NextResponse.json({ success: true, message: 'No stale submissions to sweep', count: 0 })
  }

  // 2. Mark them as expired
  const ids = expiredSubmissions.map((s: any) => s.id)
  
  const { error: updateErr } = await admin
    .from('submissions')
    .update({ status: 'expired' })
    .in('id', ids)

  if (updateErr) {
    return NextResponse.json({ error: 'Failed to mark submissions as expired', details: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: ids.length, message: `Swept ${ids.length} stale payee submissions` })
}
