// lib/notifications/index.ts
// Priority chain dispatcher: WhatsApp → Push → Email
// Stops at first successful delivery. Logs each attempt.

import { whatsappProvider } from './whatsapp'
import { pushProvider } from './push'
import { emailProvider } from './email'
import type { NotificationPayload, NotificationResult, NotificationChannel } from './types'

const PRIORITY_CHAIN = [whatsappProvider, pushProvider, emailProvider]

/**
 * Dispatch a notification through the priority chain.
 * Tries WhatsApp first, falls back to Push, then Email.
 * Stops on first success.
 *
 * @returns The result from the successful channel, or the last failure result.
 */
export async function dispatchNotification(
  payload: NotificationPayload,
  options?: {
    /** Force a specific channel — bypasses priority chain */
    channel?: NotificationChannel
    /** Skip specific channels */
    skip?: NotificationChannel[]
  }
): Promise<NotificationResult> {
  const skip = new Set(options?.skip ?? [])

  if (options?.channel) {
    const provider = PRIORITY_CHAIN.find((p) => p.name === options.channel)
    if (!provider) return { channel: options.channel, success: false, error: 'Unknown channel' }
    return await provider.send(payload)
  }

  let lastResult: NotificationResult = {
    channel: 'email',
    success: false,
    error: 'No channel could deliver the notification',
  }

  for (const provider of PRIORITY_CHAIN) {
    if (skip.has(provider.name)) continue

    const result = await provider.send(payload)
    lastResult = result

    if (result.success) {
      console.log(`[notification] Delivered via ${result.channel} (messageId: ${result.messageId ?? 'n/a'})`)
      return result
    }

    console.warn(`[notification] ${provider.name} failed: ${result.error}. Trying next channel...`)
  }

  console.error('[notification] All channels failed:', lastResult.error)
  return lastResult
}

export { whatsappProvider, pushProvider, emailProvider }
export type { NotificationPayload, NotificationResult, NotificationChannel }
