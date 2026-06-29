// lib/payments/mpesa.ts
// Daraja API integration for Kenya: C2B, STK Push, tenant rent reconciliation

import { PaymentInitiateParams, PaymentResult, WebhookResult, PaymentProvider } from './types';

// Safaricom Daraja API endpoints (mocked for Phase 1 MVP frontend)
// Real implementation requires getting access token from Daraja OAuth endpoint
const DARAJA_BASE_URL = 'https://sandbox.safaricom.co.ke';

export const mpesaProvider: PaymentProvider = {
  name: 'mpesa',
  
  async initiatePayment(params: PaymentInitiateParams): Promise<PaymentResult> {
    if (!params.phone) {
      return { success: false, error: 'Phone number is required for M-Pesa STK Push' };
    }

    try {
      // Phase 1 MVP: Initiate STK Push via Daraja API
      // 1. Get OAuth token
      // 2. Call /mpesa/stkpush/v1/processrequest
      
      // MOCK IMPLEMENTATION (Replace with actual fetch to Daraja in edge function)
      console.log(`Initiating M-Pesa STK Push to ${params.phone} for KES ${params.amount}`);
      
      return {
        success: true,
        checkoutRequestId: `ws_CO_${Date.now()}`,
        transactionId: `TXN${Date.now()}`,
      };
    } catch (error: unknown) {
      const err = error as Error;
      return { success: false, error: err.message || 'M-Pesa STK Push failed' };
    }
  },

  async handleWebhook(payload: Record<string, any>): Promise<WebhookResult> {
    // Phase 1 MVP: Handle C2B and STK Push callbacks
    // 1. Validate payload structure
    // 2. Extract transaction details
    
    // Support both STK Push (Body.stkCallback) and C2B Validation/Confirmation
    if (payload?.Body?.stkCallback) {
      const callback = payload.Body.stkCallback;
      const resultCode = callback.ResultCode;
      
      if (resultCode !== 0) {
        return {
          isValid: false,
          amount: 0,
          reference: '',
          transactionCode: '',
          paidAt: new Date(),
          rawPayload: payload
        };
      }

      const items = callback.CallbackMetadata.Item;
      const amount = items.find((i: any) => i.Name === 'Amount')?.Value || 0;
      const receipt = items.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value || '';
      const phone = items.find((i: any) => i.Name === 'PhoneNumber')?.Value || '';

      return {
        isValid: true,
        amount: Number(amount),
        reference: callback.CheckoutRequestID, // We match by CheckoutRequestID for STK
        transactionCode: receipt,
        tenantPhone: phone.toString(),
        paidAt: new Date(),
        rawPayload: payload
      };
    } else if (payload?.TransID) {
      // C2B Confirmation
      return {
        isValid: true,
        amount: Number(payload.TransAmount),
        reference: payload.BillRefNumber || '', // e.g., Unit Code A1
        transactionCode: payload.TransID,
        tenantPhone: payload.MSISDN,
        paidAt: new Date(payload.TransTime), // Requires formatting in real app
        rawPayload: payload
      };
    }

    return {
      isValid: false,
      amount: 0,
      reference: '',
      transactionCode: '',
      paidAt: new Date(),
      rawPayload: payload
    };
  },

  async verifyTransaction(transactionId: string): Promise<{ confirmed: boolean; amount?: number }> {
    // Daraja /mpesa/transactionstatus/v1/query
    console.log(`Verifying M-Pesa transaction ${transactionId}`);
    return { confirmed: true, amount: 0 };
  }
};
