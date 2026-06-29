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
  today.setHours(0, 0, 0, 0) // Start of today

  try {
    const { data: landlords, error } = await admin
      .from('landlords')
      .select('id, name, subscription_status, trial_ends_at')
      .neq('subscription_status', 'expired')

    if (error) throw error
    if (!landlords || landlords.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    let processedCount = 0

    for (const landlord of landlords) {
      if (!landlord.trial_ends_at) continue

      const dueDate = new Date(landlord.trial_ends_at)
      dueDate.setHours(0, 0, 0, 0)

      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      const { data: profiles } = await admin
        .from('profiles')
        .select('id')
        .eq('landlord_id', landlord.id)
        .eq('role', 'landlord')

      if (!profiles) continue

      for (const profile of profiles) {
        if (diffDays === 3) {
          // 3 Days before
          await notify(profile.id, 'Subscription Reminder', 'Your EstateTrack subscription expires in 3 days. Please renew to avoid service interruption.')
          processedCount++
        } else if (diffDays === 0) {
          // On Due Date
          await notify(profile.id, 'Subscription Due Today', 'Your EstateTrack subscription expires today. Please renew your plan.')
          processedCount++
        } else if (diffDays <= -2 && landlord.subscription_status !== 'expired') {
          // 2 Days Past Due Date (Grace period over)
          await admin.from('landlords').update({ subscription_status: 'expired' }).eq('id', landlord.id)
          await notify(profile.id, 'Subscription Expired', 'Your grace period has ended and your subscription has expired. Premium features are now locked.')
          processedCount++
        }
      }
    }

    return NextResponse.json({ success: true, processed: processedCount })
  } catch (err: any) {
    console.error('Cron billing error:', err)
    return NextResponse.json({ error: 'Failed to process billing reminders' }, { status: 500 })
  }
}

async function notify(profileId: string, title: string, message: string) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    profile_id: profileId,
    title,
    message,
    type: 'billing_reminder',
    link: '/settings/billing'
  })
  await sendNotification(profileId, { title, body: message, data: { url: '/settings/billing' } })
}
