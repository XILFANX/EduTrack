# Known Issues & Tech Debt

An honest register of technical limitations and planned architectural changes for EduTrack.

---

## 1. Missing CBC Rubric Support

> **Severity: High**

The Kenyan academic system is shifting entirely to the Competency Based Curriculum (CBC). Currently, the `exam_results` table only accepts raw numeric scores and standard percentage-based letter grades (A-E). 

**Impact:** The system cannot natively generate a CBC-compliant report card (Exceeds Expectations, Meets Expectations, etc.).

**Fix required:** A major schema overhaul to introduce `competencies`, `strands`, and `sub-strands` tables, shifting grading from a single numeric score per subject to an array of competency evaluations.

---

## 2. Incomplete Inventory and Transport Schema

> **Severity: Medium**

The Next.js `apps/web/middleware.ts` guards the `/library`, `/store`, and `/transport` routes. The UI scaffolds exist. However, the database schema (`backend/supabase/migrations`) does not contain robust tables for checking out library books, managing fines, or assigning students to specific bus routes.

**Impact:** The Librarian, Storekeeper, and Transport Matron roles have very little functional utility at present.

---

## 3. M-Pesa C2B Paybill Sync

> **Severity: Medium**

The current fee payment flow relies on STK Push, where a parent initiates the payment from the parent portal (`/parent`). If a parent pays directly from their SIM toolkit to the school's Paybill number, the transaction does not automatically reflect in the `fee_payments` ledger.

**Fix required:** Implement the Daraja C2B Validation and Confirmation webhook endpoints to catch direct Paybill deposits, match the account reference to an `admission_number`, and automatically clear the invoice balance.

---

## 4. The Admin Role RLS Trap

> **Severity: Low (Developer Experience)**

Because the `admin` role lacks a `school_id`, standard RLS policies (`school_id = get_auth_school_id()`) lock the admin out of all tenant tables. Every time a new table is added, developers must remember to explicitly grant the `admin` role access via a secondary policy clause.

**Fix:** A cleaner approach might be to assign the Platform Owner a dummy `school_id` and handle global access in a centralized `get_auth_school_id()` override, though this introduces its own risks. For now, strict vigilance during schema creation is required.

---

## 5. Clear Chat — localStorage Only (No Server Persistence)

> **Severity: Low (UX limitation)**

"Clear Chat" uses a client-side `localStorage` entry (`cleared_chat_${conversationId}_${userId}`) to record when a user cleared a conversation. Messages with `created_at` older than this timestamp are filtered out on load.

**Impact:**
- Clearing a chat on Device A does not clear it on Device B (e.g. mobile and desktop).
- Clearing browser storage (private mode, clearing site data) restores all previously cleared messages.

**Fix required (if server-side enforcement is needed):** Add `cleared_at_user1` and `cleared_at_user2` nullable timestamp columns to the `conversations` table. The server page passes `cleared_at` to the client on load; the client uses it instead of `localStorage`. This requires a schema migration and a new server action to persist the timestamp.
