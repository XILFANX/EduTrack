// lib/utils/formatting.ts
// Display formatting for currency, phone numbers, and dates.
// Always uses Intl APIs — no external dependencies.

import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'

/**
 * Format a monetary amount for display.
 * @example formatCurrency(15000, 'KES', 'en-KE') → "KES 15,000"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'KES',
  locale: string = 'en-KE'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback for unknown currencies
    return `${currency} ${amount.toLocaleString()}`
  }
}

/**
 * Normalise a phone number to E.164 format.
 * @example normalisePhone('0712345678', 'KE') → '+254712345678'
 */
export function normalisePhone(raw: string, countryCode: string = 'KE'): string | null {
  try {
    if (isValidPhoneNumber(raw, countryCode as Parameters<typeof isValidPhoneNumber>[1])) {
      const parsed = parsePhoneNumber(raw, countryCode as Parameters<typeof parsePhoneNumber>[1])
      return parsed.format('E.164')
    }
    // Try parsing as-is (already includes country code)
    const parsed = parsePhoneNumber(raw)
    return parsed.format('E.164')
  } catch {
    return null
  }
}

/**
 * Format a phone number for display.
 * @example formatPhone('+254712345678') → '+254 712 345 678'
 */
export function formatPhone(e164Phone: string): string {
  try {
    const parsed = parsePhoneNumber(e164Phone)
    return parsed.formatInternational()
  } catch {
    return e164Phone
  }
}

/**
 * Format a date for display.
 * @example formatDate(new Date(), 'Africa/Nairobi') → '3 Mar 2026'
 */
export function formatDate(
  date: Date | string,
  timezone: string = 'Africa/Nairobi',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: timezone,
    ...options,
  }).format(d)
}

/**
 * Format a date as a short string.
 * @example formatDateShort(new Date()) → '03/03/2026'
 */
export function formatDateShort(date: Date | string, timezone: string = 'Africa/Nairobi'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: timezone,
  }).format(d)
}

/**
 * Get number of days in a given month.
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Format a month/year pair for display.
 * @example formatMonthYear(3, 2026) → 'March 2026'
 */
export function formatMonthYear(month: number, year: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-KE', {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Generate a receipt number with prefix and zero-padded sequence.
 * @example generateReceiptNo('ET', 1042) → 'ET-001042'
 */
export function generateReceiptNo(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, '0')}`
}
