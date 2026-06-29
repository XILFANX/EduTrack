import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * Auto-generates rent invoices for all active tenants across all landlords.
 * Designed to run on the 28th of each month (generating for the upcoming month).
 * Secured with CRON_SECRET bearer token.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Generate for NEXT month
  const now = new Date()
  let month = now.getMonth() + 2 // next month (1-indexed)
  let year = now.getFullYear()
  if (month > 12) {
    month = 1
    year += 1
  }

  try {
    // Fetch all active landlords
    const { data: landlords, error: landlordErr } = await admin
      .from('landlords')
      .select('id, rent_due_day, currency')
      .neq('subscription_status', 'expired')

    if (landlordErr) throw landlordErr
    if (!landlords?.length) return NextResponse.json({ success: true, processed: 0 })

    let totalCreated = 0
    let totalSkipped = 0

    for (const landlord of landlords) {
      const dueDay = landlord.rent_due_day ?? 5
      const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

      // Fetch active tenants for this landlord
      const { data: tenants } = await admin
        .from('tenants')
        .select('id, unit_id, profile_id, full_name, units(rent_amount)')
        .eq('landlord_id', landlord.id)
        .eq('status', 'active')

      if (!tenants?.length) continue

      const tenantIds = tenants.map(t => t.id)

      // Check which already have invoices for this month/year
      const { data: existing } = await admin
        .from('invoices')
        .select('tenant_id')
        .in('tenant_id', tenantIds)
        .eq('month', month)
        .eq('year', year)

      const alreadyHave = new Set((existing ?? []).map(e => e.tenant_id))

      const toInsert = tenants
        .filter(t => !alreadyHave.has(t.id) && t.unit_id)
        .map(t => {
          const unit = t.units as unknown as { rent_amount: number } | null
          const rentAmount = unit?.rent_amount ?? 0
          return {
            landlord_id: landlord.id,
            tenant_id: t.id,
            unit_id: t.unit_id as string,
            month,
            year,
            base_rent: rentAmount,
            total_amount: rentAmount,
            paid_amount: 0,
            balance: rentAmount,
            status: 'unpaid',
            due_date: dueDate,
          }
        })

      totalSkipped += alreadyHave.size

      if (toInsert.length === 0) continue

      const { error: insertErr } = await admin.from('invoices').insert(toInsert)
      if (insertErr) {
        console.error(`Failed to insert invoices for landlord ${landlord.id}:`, insertErr.message)
        continue
      }

      totalCreated += toInsert.length

      // Notify each tenant that their invoice for next month is ready
      const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const monthLabel = MONTH_NAMES[month - 1]

      for (const t of toInsert) {
        const tenant = tenants.find(ten => ten.id === t.tenant_id)
        if (!tenant?.profile_id) continue

        await admin.from('notifications').insert({
          profile_id: tenant.profile_id,
          title: `${monthLabel} ${year} Invoice Ready`,
          message: `Your rent invoice for ${monthLabel} ${year} has been generated. Due date: ${new Date(dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'long' })}.`,
          type: 'invoice_generated',
          link: '/tenant/payments'
        })

        await sendNotification(tenant.profile_id, {
          title: `${monthLabel} ${year} Invoice Ready`,
          body: `Your rent invoice has been generated. Tap to view.`,
          data: { url: '/tenant/payments' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      month,
      year,
      invoicesCreated: totalCreated,
      invoicesSkipped: totalSkipped,
    })
  } catch (err: any) {
    console.error('Cron generate-invoices error:', err)
    return NextResponse.json({ error: 'Failed to generate invoices', details: err.message }, { status: 500 })
  }
}
