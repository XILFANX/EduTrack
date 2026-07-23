# Module: Parent Portal

## Purpose
A read-only interface for parents (the "Tenants" of the school) to view their children's academic performance, track attendance, communicate with teachers, and pay fees via M-Pesa.

## Public Interface
- **Access Route:** `/parent/*`
- **Role Requirement:** `parent`

## Implementation Notes
- **Multi-Student Linking:** A parent's view is strictly filtered by the `public.student_parents` bridging table. This allows a single parent to view dashboards for multiple children across different classes from a single account.
- **M-Pesa Trigger:** When a parent clicks "Pay Fees", the frontend initiates a request to the Next.js API route (`/api/billing/mpesa-stk`), which logs an entry in `public.mpesa_stk_requests` and hits the Safaricom Daraja API.

## Best Practices
- **Strict Isolation:** RLS policies absolutely guarantee that a parent can only `SELECT` records (invoices, exam results, attendance) where the `student_id` belongs to them in the `student_parents` table. 

## Dependencies
- Writes to: `public.messages`, `public.mpesa_stk_requests`
- Reads from: `public.invoices`, `public.exam_results`, `public.attendance`, `public.students`
