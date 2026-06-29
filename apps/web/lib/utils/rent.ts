// lib/utils/rent.ts
// Core rent calculation logic — penalty, proration, arrears, grace period.
// All financial math done in numbers; display formatting is in formatting.ts.
// These functions are unit-tested — keep them pure with no side effects.

/** Penalty configuration for a lease */
export interface PenaltyConfig {
  type: 'flat' | 'percentage'
  amount: number
  cap?: number | null
}

/**
 * Calculate the late payment penalty for an invoice.
 * @param rentAmount Base rent amount
 * @param config Penalty configuration from lease record
 * @returns Penalty amount (never exceeds cap if set)
 */
export function calculatePenalty(rentAmount: number, config: PenaltyConfig): number {
  if (config.amount <= 0) return 0

  const raw =
    config.type === 'flat'
      ? config.amount
      : (rentAmount * config.amount) / 100

  if (config.cap && config.cap > 0) {
    return Math.min(raw, config.cap)
  }

  return raw
}

/**
 * Calculate prorated rent for a partial month.
 * Used when a tenant moves in mid-cycle.
 *
 * @param fullMonthRent Full month rent amount
 * @param moveInDay Day of month tenant moved in (1-based)
 * @param daysInMonth Total days in the billing month
 * @returns Prorated rent rounded to 2 decimal places
 */
export function calculateProration(
  fullMonthRent: number,
  moveInDay: number,
  daysInMonth: number
): number {
  if (moveInDay <= 1) return fullMonthRent
  const remainingDays = daysInMonth - moveInDay + 1
  const daily = fullMonthRent / daysInMonth
  return Math.round(daily * remainingDays * 100) / 100
}

/**
 * Determine if a payment is within the grace period.
 * @param dueDate Invoice due date
 * @param paymentDate Date of payment
 * @param gracePeriodDays Grace period days from lease config
 * @returns true if payment is within grace period (no penalty applies)
 */
export function isWithinGracePeriod(
  dueDate: Date,
  paymentDate: Date,
  gracePeriodDays: number
): boolean {
  const graceEnd = new Date(dueDate)
  graceEnd.setDate(graceEnd.getDate() + gracePeriodDays)
  return paymentDate <= graceEnd
}

/**
 * Compute how many days overdue an invoice is from today.
 * Returns 0 if not yet overdue.
 */
export function getDaysOverdue(dueDate: Date, gracePeriodDays: number): number {
  const now = new Date()
  const graceEnd = new Date(dueDate)
  graceEnd.setDate(graceEnd.getDate() + gracePeriodDays)

  if (now <= graceEnd) return 0
  const diff = now.getTime() - graceEnd.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * Compute arrears aging band for display.
 */
export function getAgeingBand(daysOverdue: number): 'current' | '30d' | '60d' | '90d+' {
  if (daysOverdue <= 0) return 'current'
  if (daysOverdue <= 30) return '30d'
  if (daysOverdue <= 60) return '60d'
  return '90d+'
}

/**
 * Calculate the invoice total from its components.
 * Mirrors the DB generated column: base_rent + arrears + penalties - credits
 */
export function calculateInvoiceTotal(params: {
  baseRent: number
  arrears: number
  penalties: number
  credits: number
}): number {
  return params.baseRent + params.arrears + params.penalties - params.credits
}

/**
 * Calculate remaining balance on an invoice.
 */
export function calculateBalance(total: number, paidAmount: number): number {
  return Math.max(0, total - paidAmount)
}
