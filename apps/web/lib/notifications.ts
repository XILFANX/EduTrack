import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized || !PUBLIC_KEY || !PRIVATE_KEY) return
  try {
    webpush.setVapidDetails(
      `mailto:hello@${new URL(APP_URL).hostname}`,
      PUBLIC_KEY,
      PRIVATE_KEY
    )
    vapidInitialized = true
  } catch {
    // VAPID keys not valid, push disabled
  }
}

interface NotificationPayload {
  title: string
  body: string
  data?: Record<string, any>
}

/**
 * Send a push notification to all devices registered for a given user profile.
 */
export async function sendNotification(profileId: string, payload: NotificationPayload) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured, skipping notification to:', profileId)
    return
  }
  ensureVapid()
  if (!vapidInitialized) return

  const admin = createAdminClient()
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId)

  if (error || !subs || subs.length === 0) return

  const notifications = subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        },
        JSON.stringify(payload)
      )
    } catch (error: unknown) {
      const err = error as any
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription has expired or is no longer valid, delete it
        await admin.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        console.error('[Push] Error sending to endpoint:', sub.endpoint, err)
      }
    }
  })

  await Promise.all(notifications)
}

/**
 * Simulate sending an SMS OTP to a phone number.
 * In a production environment, you would integrate Africa's Talking, Twilio, or WhatsApp API here.
 */
export async function sendSmsOtp(phone: string, otp: string) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  console.log('\n=========================================')
  console.log(`💬 MOCK SMS SENT TO: ${phone}`)
  console.log(`🔐 YOUR RESET OTP IS: ${otp}`)
  console.log('=========================================\n')

  return { success: true }
}
