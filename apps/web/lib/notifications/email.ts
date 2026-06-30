// lib/notifications/email.ts
// Email notification provider — currently disabled as we are using simplified manual flow.

import type { NotificationProvider, NotificationPayload, NotificationResult } from './types'

export const emailProvider: NotificationProvider = {
  name: 'email',

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    console.log('[Email Mock] Sending email to:', payload.email, 'Subject:', payload.subject)
    
    // We mock success since we don't send emails currently
    return { channel: 'email', success: true, messageId: 'mock-id' }
  },
}
