# Known Issues & Tech Debt

An honest register of where the code currently falls short of the PRD or requires cleanup.

## 1. Grading Engine is Too Simple (Missing CBC Support)
- **What it is:** The PRD mandates a "Flexible Grading Engine" supporting rubric-based competency evaluations (Kenya CBC).
- **The Reality:** The current `exam_results` table only has `score numeric` and `grade text`. 
- **The Debt:** A future PR needs to overhaul the academic schema to support dynamic rubrics (e.g., Exceeds Expectations, Meets Expectations) mapped against specific competency metrics, rather than just simple percentages.

## 2. Missing Mobile App
- **What it is:** The PRD dictates an Expo React Native app located in `apps/mobile/`.
- **The Reality:** The repository currently only contains `apps/web/`. Parents are forced to use the Next.js web application.
- **The Debt:** The mobile application needs to be initialized.

## 3. Incomplete Modules (Health & Library)
- **What it is:** The PRD mentions a "Health & Discipline Log" and a "Library-Bursar Bridge" to automate fines.
- **The Reality:** There are no database tables tracking library books, loans, fines, sick bay visits, or disciplinary incidents.
- **The Debt:** The `inventory_ledger` is currently too generic to support library workflows, and a dedicated `health_logs` table needs to be created.

## 4. M-Pesa C2B Paybill Auto-Reconciliation
- **What it is:** The PRD mentions automatic matching of standard C2B Paybill payments.
- **The Reality:** We only have explicit tracking for STK pushes (`mpesa_stk_requests`). If a parent goes to their SIM toolkit and manually pays via the Paybill number, there is no explicit ledger table built to catch and reconcile the C2B webhook payload yet.
