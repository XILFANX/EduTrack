# API Reference

Like EstateTrack, EduTrack relies primarily on Server Actions and Supabase JS for data access. External APIs are exposed strictly for webhooks and cron schedulers.

---

## Authentication

Authentication is handled via the `@supabase/ssr` package. All route handlers must validate sessions using `createClient()` from `lib/supabase/server.ts`. 

Do not use `createAdminClient()` (the service role key) unless processing a secure server-to-server webhook where the caller identity is verified via an external secret.

---

## Billing — M-Pesa Integration

### `POST /api/mpesa/callback`

Receives the Safaricom Daraja callback for school fee payments.

**Auth:** None (Public endpoint). 

**Flow:**
1. Validates the `stkCallback` payload structure.
2. Extracts `CheckoutRequestID`, `ResultCode`, and `Amount`.
3. If successful (`ResultCode === 0`):
   - Finds the pending request in `mpesa_stk_requests` using `checkout_request_id`.
   - Inserts a new record into `fee_payments` mapping the amount to the `student_id` and `invoice_id`.
   - Deducts the paid amount from `invoices.balance`.
   - Updates `invoices.status` to `paid` or `partial`.
4. If failed: Updates `mpesa_stk_requests.status` to `Failed`.

**Response:** Always returns `{ ResultCode: 0, ResultDesc: 'Accepted' }` to acknowledge receipt to Safaricom, even on payment failure (so Safaricom stops retrying).

---

## Cron Jobs

### `GET /api/cron/generate-invoices`

Runs automatically based on the Vercel cron schedule (typically the 1st of the month or start of term).

**Auth:** Header `Authorization: Bearer <CRON_SECRET>` is required.

**Flow:**
1. Identifies the active `academic_term`. If none is active, execution halts.
2. Selects all active students.
3. Calculates the total fee by evaluating the `fee_structures` linked to their `class_id` or globally.
4. Inserts rows into `invoices` and `invoice_items`.
5. Sends an alert (SMS/Push) to the parent linked via `student_parents`.

---

## System Administration

### `POST /api/admin/bootstrap`

One-time setup route for provisioning the root Platform Owner (`admin` role).

**Auth:** Header `X-Bootstrap-Secret` must match the `BOOTSTRAP_SECRET` env var.
