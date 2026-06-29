// Notification Provider abstraction — priority chain: WhatsApp → Push → Email

export type NotificationChannel = 'whatsapp' | 'push' | 'email'

export interface NotificationPayload {
  /** Recipient phone number in E.164 format (e.g. +254712345678) */
  phone?: string
  /** Recipient email address */
  email?: string
  /** Profile ID — used to look up push subscriptions */
  profileId?: string
  /** Plain text message body */
  message: string
  /** Subject line (email only) */
  subject?: string
  /** WhatsApp template name (pre-approved by Meta) */
  templateName?: string
  /** Template variables for WhatsApp templates */
  templateParams?: string[]
}

export interface NotificationResult {
  channel: NotificationChannel
  success: boolean
  messageId?: string
  error?: string
}

export interface NotificationProvider {
  name: NotificationChannel
  send(payload: NotificationPayload): Promise<NotificationResult>
}
