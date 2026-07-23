# API Reference

This document outlines the externally exposed endpoints for EduTrack. Note that the primary application routes are Next.js Server Components and Server Actions, which do not expose traditional REST endpoints. 

The endpoints below are explicitly exposed for third-party integrations and webhooks.

## Billing & M-Pesa

### 1. Initiate M-Pesa STK Push
**Endpoint:** `POST /api/billing/mpesa-stk`
**Auth Required:** Yes (Bursar or Parent session)
**Description:** Initiates a Safaricom M-Pesa STK push prompt on the user's phone.
**Request Body:**
```json
{
  "invoiceId": "uuid",
  "studentId": "uuid",
  "amount": 5000,
  "phoneNumber": "254700000000"
}
```

### 2. M-Pesa Webhook Callback
**Endpoint:** `POST /api/billing/mpesa-webhook`
**Auth Required:** No (Secured via Safaricom IP safelist / secret validation)
**Description:** Safaricom calls this endpoint to deliver the success/failure result of an STK push or a C2B Paybill transaction.
**Response:** HTTP 200 (Required by Safaricom)

### 3. Check M-Pesa Status
**Endpoint:** `GET /api/billing/mpesa-status/[checkoutId]`
**Auth Required:** Yes
**Description:** Polls the status of an initiated STK push.

## Administration

### 1. Bootstrap Admin
**Endpoint:** `GET /api/admin/bootstrap`
**Auth Required:** No (Protected via environment variables)
**Description:** A utility endpoint used during initial deployment to set up the root `platform_owner` (Admin) account.

## Cron Jobs (Background Tasks)

### 1. Generate Invoices
**Endpoint:** `POST /api/cron/generate-invoices`
**Auth Required:** No (Protected via Vercel Cron Secret)
**Description:** Triggered at the start of a term to automatically generate fee invoices for all active students based on their class `fee_structures`.

### 2. Send Notifications
**Endpoint:** `POST /api/cron/notifications`
**Auth Required:** No (Protected via Vercel Cron Secret)
**Description:** Processes the queue of pending WhatsApp/Email notifications (e.g., attendance alerts, fee reminders).
