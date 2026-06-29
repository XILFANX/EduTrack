// lib/notifications/push.ts
// PWA Web Push notifications via Serwist / web-push

import webPush from 'web-push'
import type { NotificationProvider, NotificationPayload, NotificationResult } from './types'

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return
  try {
    webPush.setVapidDetails(
      `mailto:hello@estatetrack.co.ke`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
    vapidInitialized = true
  } catch {
    // VAPID keys invalid, push disabled
  }
}

export const pushProvider: NotificationProvider = {
  name: 'push',

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.profileId) {
      return { channel: 'push', success: false, error: 'profileId required for push notifications' }
    }

    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return { channel: 'push', success: false, error: 'VAPID keys not configured' }
    }

    ensureVapid()
    if (!vapidInitialized) {
      return { channel: 'push', success: false, error: 'VAPID initialization failed' }
    }

    try {
      // Subscriptions are fetched from the DB by the calling Edge Function
      // This provider accepts a pre-fetched subscription object in metadata
      const subscription = payload as unknown as {
        endpoint: string
        p256dh: string
        auth: string
        message: string
      }

      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({ title: 'EstateTrack', body: payload.message })
      )

      return { channel: 'push', success: true }
    } catch (err) {
      return { channel: 'push', success: false, error: (err as Error).message }
    }
  },
}
