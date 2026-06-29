// lib/payments/index.ts
// Provider resolver — returns the correct payment provider based on country code.
//
// Kenya (KE):
//   - Tenant rent payments → M-Pesa Daraja API (C2B Paybill, STK Push)
//   - Landlord subscription billing → Pesapal (KES)
//
// International (all other countries):
//   - Tenant rent payments → Paddle (hosted checkout, card & wallet)
//   - Landlord subscription billing → Paddle (USD, MoR, automatic VAT/tax)

import { pesapalProvider } from "./pesapal";
import { paddleProvider } from "./paddle";
import { mpesaProvider } from "./mpesa";
import type { PaymentProvider } from "./types";

/**
 * Returns the subscription provider for a given country.
 *  KE  → Pesapal (M-Pesa, Airtel, local cards in KES)
 *  All others → Paddle (MoR, multi-currency, tax)
 */
export function getSubscriptionProvider(countryCode: string): PaymentProvider {
  if (countryCode.toUpperCase() === "KE") return pesapalProvider;
  return paddleProvider;
}

/**
 * Returns the rent provider for a given country.
 *  KE  → M-Pesa Daraja API (STK Push, C2B Paybill)
 *  All others → Paddle
 */
export function getRentProvider(countryCode: string): PaymentProvider {
  if (countryCode.toUpperCase() === "KE") return mpesaProvider;
  return paddleProvider;
}

export { pesapalProvider, paddleProvider, mpesaProvider };
export type { PaymentProvider };
