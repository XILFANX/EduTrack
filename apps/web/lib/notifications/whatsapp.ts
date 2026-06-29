// lib/notifications/whatsapp.ts
// Meta Cloud API — WhatsApp Business messaging

import type { NotificationProvider, NotificationPayload, NotificationResult } from './types'

const BASE_URL = 'https://graph.facebook.com/v19.0'

export const whatsappProvider: NotificationProvider = {
  name: 'whatsapp',

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.phone) {
      return { channel: 'whatsapp', success: false, error: 'Phone number required for WhatsApp' }
    }

    if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      return { channel: 'whatsapp', success: false, error: 'WhatsApp credentials not configured' }
    }

    try {
      const body = payload.templateName
        ? // Template message (pre-approved by Meta — required for outbound)
          {
            messaging_product: 'whatsapp',
            to: payload.phone.replace(/^\+/, ''),
            type: 'template',
            template: {
              name: payload.templateName,
              language: { code: 'en' },
              components: payload.templateParams?.length
                ? [
                    {
                      type: 'body',
                      parameters: payload.templateParams.map((text) => ({ type: 'text', text })),
                    },
                  ]
                : [],
            },
          }
        : // Free-form text (only within 24h customer service window)
          {
            messaging_product: 'whatsapp',
            to: payload.phone.replace(/^\+/, ''),
            type: 'text',
            text: { body: payload.message },
          }

      const res = await fetch(
        `${BASE_URL}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const data = await res.json()

      if (data.messages?.[0]?.id) {
        return { channel: 'whatsapp', success: true, messageId: data.messages[0].id }
      }

      return { channel: 'whatsapp', success: false, error: data.error?.message ?? 'WhatsApp send failed' }
    } catch (err) {
      return { channel: 'whatsapp', success: false, error: (err as Error).message }
    }
  },
}
