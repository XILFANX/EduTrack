// lib/notifications/email.ts
// Resend email provider — fallback notification channel

import { Resend } from 'resend'
import type { NotificationProvider, NotificationPayload, NotificationResult } from './types'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export const emailProvider: NotificationProvider = {
  name: 'email',

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!payload.email) {
      return { channel: 'email', success: false, error: 'Email address required' }
    }

    if (!process.env.RESEND_API_KEY) {
      return { channel: 'email', success: false, error: 'Resend API key not configured' }
    }

    try {
      const resend = getResend()
      const { data, error } = await resend.emails.send({
        from: 'EstateTrack <notifications@estatetrack.co.ke>',
        to: [payload.email],
        subject: payload.subject ?? 'EstateTrack Notification',
        text: payload.message,
        html: `<p>${payload.message.replace(/\n/g, '<br/>')}</p>
               <hr/>
               <p style="color:#6b7280;font-size:12px;">
                 EstateTrack · Property Management Platform<br/>
                 Manage your account at <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a>
               </p>`,
      })

      if (error) return { channel: 'email', success: false, error: error.message }
      return { channel: 'email', success: true, messageId: data?.id }
    } catch (err) {
      return { channel: 'email', success: false, error: (err as Error).message }
    }
  },
}
