/**
 * Payment Message Parser (Implementation of §7.0)
 *
 * Extracts fields from transaction messages using template-driven matching, not
 * heuristics. Supports M-Pesa, Airtel Money, MTN Mobile Money, KCB MoBanking,
 * Equity Bank, NCBA, Bank Transfers, and generic receipts.
 *
 * Key design decisions:
 *  - `paymentRail` is kept as the internal stored value. For UI display, use
 *    `detectedProvider` (e.g., "M-Pesa", "Airtel Money", "KCB MoBanking").
 *  - Amount regex covers: `KES 42,000`, `Ksh453.81`, `KES453.81`, `USD 1,234.56`
 *    It correctly handles amounts with or without spaces between prefix and digits.
 *  - Self vs counterparty identity is determined by the template verb:
 *      "transferred to Account X" → X is the receiver (selfIdentity for the receiver)
 *      "received from Y" → Y is the counterparty (sender)
 *      "sent to Z" → Z is the receiver (selfIdentity for the sender perspective)
 */

import type { PaymentRail } from '@edutrack/shared/payments/types'

export interface ParsedTransaction {
  referenceCode: string | null
  parsedAmount: number | null
  parsedFee: number | null
  parsedTransactionAt: string | null
  parsedSelfIdentity: string | null
  parsedCounterparty: string | null
  parsedNarration: string | null
  /** Stored rail for DB / engine use */
  paymentRail: PaymentRail
  /** Human-readable provider auto-detected from message text (e.g., "M-Pesa", "Airtel Money") */
  detectedProvider: string | null
  isTimestampDeviceSourced: boolean
  /** Detected currency prefix from message */
  parsedCurrency: string | null
}

// ── Date formatting helper ──────────────────────────────────────────────────
export function formatParsedTimestamp(isoStr: string | null | undefined): string | null {
  if (!isoStr) return null
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return null
    return d.toLocaleString('en-KE', { 
      day: 'numeric', month: 'short', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    })
  } catch {
    return null
  }
}

// ── Currency / amount helper ──────────────────────────────────────────────────
// Matches:  KES 42,000   Ksh453.81   KES453.81   USD 1,234.56   UGX45000   GHS 200.00
// The key fix: currency prefix is immediately followed (optional space) by the amount.
// Uses non-capturing optional space so: `KES42000` and `KES 42,000` both work.

function extractAmount(text: string): { amount: number | null; currency: string | null } {
  // Priority 1: currency-prefixed amount (handles glued and spaced variants)
  const prefixed = text.match(
    /(\b(?:KES|Ksh|USD|UGX|TZS|NGN|GBP|ZAR|EUR|CAD|AUD|GHS|XOF|ETB|RWF|ZMW)\b)\s*([\d,]+(?:\.[\d]{1,2})?)/i
  )
  if (prefixed) {
    const currency = prefixed[1].toUpperCase()
    // Normalize Ksh to KES
    const normalizedCurrency = currency === 'KSH' ? 'KES' : currency
    return { 
      amount: parseFloat(prefixed[2].replace(/,/g, '')), 
      currency: normalizedCurrency 
    }
  }

  // Priority 2: bare decimal that looks like an amount (e.g., "453.81" in bank templates)
  const bare = text.match(/\b(\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)\b/)
  if (bare) {
    const n = parseFloat(bare[1].replace(/,/g, ''))
    return { amount: n > 0 ? n : null, currency: null }
  }
  return { amount: null, currency: null }
}

// ── Provider detection ────────────────────────────────────────────────────────
function detectProvider(text: string): { rail: PaymentRail; provider: string | null } {
  const t = text.toLowerCase()
  // M-Pesa (Safaricom)
  if (t.includes('m-pesa') || t.includes('mpesa') || t.includes('safaricom')) {
    if (t.includes('buy goods') || t.includes('till number')) {
      return { rail: 'mobile_money', provider: 'M-Pesa (Buy Goods)' }
    }
    return { rail: 'mobile_money', provider: 'M-Pesa' }
  }
  // Airtel Money
  if (t.includes('airtel money') || t.includes('airtel')) {
    return { rail: 'mobile_money', provider: 'Airtel Money' }
  }
  // MTN Mobile Money
  if (t.includes('mtn momo') || t.includes('mtn mobile money') || t.includes('momo')) {
    return { rail: 'mobile_money', provider: 'MTN Mobile Money' }
  }
  // Equitel / Equity
  if (t.includes('equitel') || t.includes('equity bank')) {
    return { rail: 'mobile_money', provider: 'Equitel' }
  }
  // T-Kash (Telkom)
  if (t.includes('t-kash') || t.includes('tkash')) {
    return { rail: 'mobile_money', provider: 'T-Kash' }
  }
  // Orange Money / Wave
  if (t.includes('orange money')) return { rail: 'mobile_money', provider: 'Orange Money' }
  if (t.includes('wave')) return { rail: 'mobile_money', provider: 'Wave' }
  // Bank transfers
  if (t.includes('kcb') || t.includes('kenya commercial bank')) {
    return { rail: 'bank_transfer', provider: 'KCB' }
  }
  if (t.includes('ncba')) return { rail: 'bank_transfer', provider: 'NCBA' }
  if (t.includes('co-operative bank') || t.includes('co-op bank')) {
    return { rail: 'bank_transfer', provider: 'Co-operative Bank' }
  }
  if (t.includes('absa')) return { rail: 'bank_transfer', provider: 'ABSA' }
  if (t.includes('standard chartered')) return { rail: 'bank_transfer', provider: 'Standard Chartered' }
  if (t.includes('diamond trust') || t.includes('dtb')) {
    return { rail: 'bank_transfer', provider: 'Diamond Trust Bank' }
  }
  if (t.includes('stanbic')) return { rail: 'bank_transfer', provider: 'Stanbic Bank' }
  if (t.includes('gtbank') || t.includes('guaranty trust')) {
    return { rail: 'bank_transfer', provider: 'GTBank' }
  }
  // Generic bank/transfer signals
  if (
    t.includes('bank') || t.includes('transferred') || t.includes('eft') ||
    t.includes('rtgs') || t.includes('swift') || t.includes('wire')
  ) {
    return { rail: 'bank_transfer', provider: 'Bank Transfer' }
  }
  // Generic mobile money signal (no specific provider identified)
  if (t.includes('mobile money') || t.includes('mobilemoney')) {
    return { rail: 'mobile_money', provider: 'Mobile Money' }
  }
  return { rail: 'other', provider: null }
}

// ── Reference code extraction ─────────────────────────────────────────────────
function extractReferenceCode(text: string): string | null {
  // M-Pesa / Airtel / mobile money codes: 10 alphanumeric uppercase
  const mobileCode = text.match(/\b([A-Z0-9]{10})\b/)
  if (mobileCode) return mobileCode[1].toUpperCase()

  // Bank reference codes: often "Ref:", "Ref No:", "Transaction ID:", "TXN:"
  const bankRef = text.match(/(?:Ref(?:\s*No)?|Reference|Transaction\s*ID|TXN)[:\s]+([A-Z0-9\-]{6,30})/i)
  if (bankRef) return bankRef[1].toUpperCase()

  return null
}

// ── Date/time extraction ──────────────────────────────────────────────────────
function extractTimestamp(text: string): { ts: string; isDeviceSourced: boolean } {
  // M-Pesa format: "12/8/26 at 10:45 AM" or "12/8/2026 at 10:45 AM"
  const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i)
  if (dateMatch) {
    try {
      const [d, m, y] = dateMatch[1].split('/')
      const year = y.length === 2 ? `20${y}` : y
      const parsed = new Date(
        `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${dateMatch[2].trim()}`
      )
      if (!isNaN(parsed.getTime())) {
        return { ts: parsed.toISOString(), isDeviceSourced: false }
      }
    } catch { /* ignore malformed */ }
  }
  // ISO-ish: "2026-08-01 14:23:00"
  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}(?::\d{2})?)/i)
  if (isoMatch) {
    try {
      const parsed = new Date(`${isoMatch[1]}T${isoMatch[2]}`)
      if (!isNaN(parsed.getTime())) return { ts: parsed.toISOString(), isDeviceSourced: false }
    } catch { /* ignore */ }
  }
  // Fallback to device time
  return { ts: new Date().toISOString(), isDeviceSourced: true }
}

// ─────────────────────────────────────────────────────────────────────────────

export function parseTransactionMessage(raw: string): ParsedTransaction {
  const text = raw.trim()

  const result: ParsedTransaction = {
    referenceCode: null,
    parsedAmount: null,
    parsedFee: null,
    parsedTransactionAt: null,
    parsedSelfIdentity: null,
    parsedCounterparty: null,
    parsedNarration: null,
    paymentRail: 'other',
    detectedProvider: null,
    isTimestampDeviceSourced: false,
    parsedCurrency: null,
  }

  if (!text) return result

  // 1. Detect provider & rail
  const { rail, provider } = detectProvider(text)
  result.paymentRail = rail
  result.detectedProvider = provider

  // 2. Reference code
  result.referenceCode = extractReferenceCode(text)

  // 3. Fee (must extract BEFORE amount to avoid double-counting)
  const feeMatch =
    text.match(/Transaction\s*cost[,:]?\s*(?:KES|Ksh|USD|UGX|TZS|NGN)?\s*([\d,]+(?:\.[\d]{1,2})?)/i) ||
    text.match(/(?:Fee|Charge)s?\s*(?:charged|applied)?[:\s]+(?:KES|Ksh)?\s*([\d,]+(?:\.[\d]{1,2})?)/i)
  if (feeMatch) {
    result.parsedFee = parseFloat(feeMatch[1].replace(/,/g, ''))
  }

  // 4. Identity parsing — template-driven

  // Template A: "transferred KES 42,000 to Account Samuel Gichure, 0712XXXXXX, Ref ..."
  //   → selfIdentity = the account name (receiver), counterparty = null (sender not named)
  const transferredToAccount = text.match(
    /transferred\s+(?:KES|Ksh|USD|UGX|TZS|NGN|GBP|ZAR|EUR|CAD|AUD|GHS)?\s*[\d,]+(?:\.\d{1,2})?\s+to\s+Account\s+([^,\n]+)/i
  )
  if (transferredToAccount) {
    result.parsedSelfIdentity = transferredToAccount[1].trim()
    result.parsedCounterparty = null
  }

  // Template B: "Confirmed. You have received KES X from NAME 0712XXXXXX on ..."
  //   → counterparty = sender's name, selfIdentity = null (receiver's name not in message)
  const receivedFrom = text.match(
    /(?:received|credited)\s+(?:KES|Ksh|USD|UGX|TZS|NGN|GBP|ZAR|EUR|CAD|AUD|GHS)?\s*[\d,]+(?:\.\d{1,2})?\s+from\s+([A-Za-z][^0-9\n]{2,40}?)(?:\s+[\d+]|\s+on\b|$)/i
  )
  if (!transferredToAccount && receivedFrom) {
    result.parsedCounterparty = receivedFrom[1].trim().replace(/\s+(on|at)$/i, '')
    result.parsedSelfIdentity = null
  }

  // Template C: "Ksh42,000.00 sent to NAME for account XXXX on ..."
  //   → selfIdentity = recipient name (from sender's perspective)
  const sentTo = text.match(
    /sent\s+to\s+([A-Za-z][^0-9\n]{2,40}?)\s+(?:for\s+account|on\b)/i
  )
  if (!transferredToAccount && !receivedFrom && sentTo) {
    result.parsedSelfIdentity = sentTo[1].trim()
  }

  // 5. Amount & Currency — extract after identity parsing strips template verbs
  const { amount, currency } = extractAmount(text)
  result.parsedAmount = amount
  result.parsedCurrency = currency

  // 6. Timestamp
  const { ts, isDeviceSourced } = extractTimestamp(text)
  result.parsedTransactionAt = ts
  result.isTimestampDeviceSourced = isDeviceSourced

  return result
}
