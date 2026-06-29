// lib/utils/invoices.ts
// Invoice assembly and line-item logic.

import { calculatePenalty, calculateInvoiceTotal, type PenaltyConfig } from './rent'
import { formatCurrency } from './formatting'

export interface InvoiceLineItem {
  label: string
  amount: number
  type: 'base' | 'arrears' | 'penalty' | 'credit'
}

export interface InvoiceParams {
  baseRent: number
  arrears: number
  penaltyConfig: PenaltyConfig
  isPenaltyApplicable: boolean
  credits: number
  currency: string
  locale: string
}

export interface InvoiceSummary {
  lineItems: InvoiceLineItem[]
  penalties: number
  total: number
  totalFormatted: string
}

/**
 * Build line items and calculate total for an invoice.
 * This is display/assembly logic only — DB has generated columns for actual storage.
 */
export function buildInvoiceSummary(params: InvoiceParams): InvoiceSummary {
  const penalties = params.isPenaltyApplicable
    ? calculatePenalty(params.baseRent, params.penaltyConfig)
    : 0

  const total = calculateInvoiceTotal({
    baseRent: params.baseRent,
    arrears: params.arrears,
    penalties,
    credits: params.credits,
  })

  const lineItems: InvoiceLineItem[] = [
    { label: 'Base Rent', amount: params.baseRent, type: 'base' },
  ]

  if (params.arrears > 0) {
    lineItems.push({ label: 'Arrears', amount: params.arrears, type: 'arrears' })
  }

  if (penalties > 0) {
    lineItems.push({ label: 'Late Payment Penalty', amount: penalties, type: 'penalty' })
  }

  if (params.credits > 0) {
    lineItems.push({ label: 'Credits Applied', amount: -params.credits, type: 'credit' })
  }

  return {
    lineItems,
    penalties,
    total,
    totalFormatted: formatCurrency(total, params.currency, params.locale),
  }
}
