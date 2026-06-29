// lib/config/country-features.ts
// Country configuration — add new countries here only.
// Core business logic reads from this file — never hardcodes country checks.
//
// Payment method values:
//   'pesapal' — Pesapal hosted checkout (supports Lipa Na M-Pesa, Airtel Money, local cards)
//   'paddle'  — Paddle Billing (international cards, wallets, Merchant of Record)

export interface CountryConfig {
  code: string
  name: string
  currency: string
  currencySymbol: string
  locale: string
  timezone: string
  phoneCountryCode: string
  primaryPaymentMethod: 'manual'
  paymentMethods: Array<'bank_transfer' | 'cash'>
  subscriptionMethod: 'mpesa_stk' | 'manual'
  receiptFormat: 'kra' | 'standard'
  dateFormat: string
}

export const KE_CONFIG: CountryConfig = {
  code: 'KE',
  name: 'Kenya',
  currency: 'KES',
  currencySymbol: 'KES',
  locale: 'en-KE',
  timezone: 'Africa/Nairobi',
  phoneCountryCode: '+254',
  primaryPaymentMethod: 'manual',
  paymentMethods: ['bank_transfer', 'cash'],
  subscriptionMethod: 'mpesa_stk',
  receiptFormat: 'kra',
  dateFormat: 'DD/MM/YYYY',
}

export const DEFAULT_CONFIG: CountryConfig = {
  code: 'GLOBAL',
  name: 'Global',
  currency: 'USD',
  currencySymbol: '$',
  locale: 'en-US',
  timezone: 'UTC',
  phoneCountryCode: '+1',
  primaryPaymentMethod: 'manual',
  paymentMethods: ['bank_transfer', 'cash'],
  subscriptionMethod: 'manual',
  receiptFormat: 'standard',
  dateFormat: 'MM/DD/YYYY',
}

// Tanzania — Phase 2
export const TZ_CONFIG: CountryConfig = {
  code: 'TZ',
  name: 'Tanzania',
  currency: 'TZS',
  currencySymbol: 'TZS',
  locale: 'en-TZ',
  timezone: 'Africa/Dar_es_Salaam',
  phoneCountryCode: '+255',
  primaryPaymentMethod: 'manual',
  paymentMethods: ['bank_transfer', 'cash'],
  subscriptionMethod: 'manual',
  receiptFormat: 'standard',
  dateFormat: 'DD/MM/YYYY',
}

export const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  KE: KE_CONFIG,
  TZ: TZ_CONFIG,
}

/**
 * Resolve configuration for a given ISO 3166-1 alpha-2 country code.
 * Falls back to DEFAULT_CONFIG for any country not explicitly configured.
 */
export function getCountryConfig(countryCode: string): CountryConfig {
  return COUNTRY_CONFIGS[countryCode.toUpperCase()] ?? DEFAULT_CONFIG
}
