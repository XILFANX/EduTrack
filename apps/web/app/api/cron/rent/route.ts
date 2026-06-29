import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    const { data: invoices, error } = await admin
      .from('invoices')
      .select(`
        id, due_date, status, month,
        tenant_id, landlord_id,
        tenants ( profile_id, users:profiles ( name ) ),
        units ( unit_number, properties ( name ) )
      `)
      .in('status', ['unpaid', 'partial'])

    if (error) throw error
    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    let processedCount = 0

    for (const inv of invoices) {
      if (!inv.due_date) continue

      const dueDate = new Date(inv.due_date)
      dueDate.setHours(0, 0, 0, 0)

      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const tenantProfileId = (inv.tenants as any)?.profile_id
      const tenantName = (inv.tenants as any)?.users?.name || 'Tenant'
      const unitNumber = (inv.units as any)?.unit_number || 'Unknown Unit'
      const propertyName = (inv.units as any)?.properties?.name || 'Property'

      if (diffDays === 3 && tenantProfileId) {
        // 3 Days before
        await notify(tenantProfileId, 'Rent Reminder', `Your rent for ${propertyName} is due in 3 days.`, '/tenant/payments')
        processedCount++
      } else if (diffDays === 0 && tenantProfileId) {
        // On Due Date
        await notify(tenantProfileId, 'Rent Due Today', `Your rent for ${propertyName} is due today!`, '/tenant/payments')
        processedCount++
      } else if (diffDays === -1) {
        // 1 Day Past Due Date (Alert Landlord to send custom grace period notification)
        const { data: profiles } = await admin
          .from('profiles')
          .select('id')
          .eq('landlord_id', inv.landlord_id)
          .eq('role', 'landlord')

        if (profiles) {
          for (const profile of profiles) {
            await notify(
              profile.id,
              'Tenant Rent Overdue',
              `${tenantName} in Unit ${unitNumber} (${propertyName}) missed their rent deadline. Please initiate a manual notification regarding their grace period before evacuation.`,
              '/settings/communications' // We will build this page later
            )
            processedCount++
          }
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })
  } catch (err: any) {
    console.error('Cron rent error:', err)
    return NextResponse.json({ error: 'Failed to process rent reminders' }, { status: 500 })
  }
}

async function notify(profileId: string, title: string, message: string, link: string) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    profile_id: profileId,
    title,
    message,
    type: 'rent_reminder',
    link
  })
  await sendNotification(profileId, { title, body: message, data: { url: link } })
}
