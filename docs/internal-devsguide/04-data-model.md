# Data Model

The schema is defined in `backend/supabase/migrations/`. 

**Primary key convention:** All tables use `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`.

---

## Core Hierarchy (Multi-Tenancy)

```
schools
 └─ users → role: admin | principal | class_teacher | ... | parent
 └─ classes
     └─ students
         └─ invoices
             └─ fee_payments
```

---

## Table Reference

### `schools`

The root tenant object. Everything belongs to a school.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | |
| `subscription_plan` | text | |
| `subscription_status` | text | `active \| inactive` |

---

### `users`

Consolidated table for all human actors. 

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | References `auth.users(id)` |
| `school_id` | uuid FK | Null for `admin` |
| `role` | text | Enforces middleware routing |
| `full_name` | text | |
| `phone` | text | |

---

### Academic Schema

| Table | Purpose |
|---|---|
| `academic_terms` | Defines the term boundaries (e.g., "2026 Term 1"). Required for invoicing. |
| `classes` | e.g. "Grade 1". Contains `class_teacher_id` FK. |
| `students` | Core academic subject. Contains `admission_number`. |
| `student_parents` | Join table. Maps a `student_id` to a `parent_id` (user). Allows parents to see multiple children. |
| `subjects` | e.g. "Mathematics". Contains `teacher_id` (Subject Teacher). |
| `attendance` | Daily roll call. Enums: `Present, Absent, Late`. |
| `exams` | Defines an assessment instance. |
| `exam_results` | Contains `score` (numeric) and `grade` (text). *Note: Does not yet support CBC rubrics.* |

---

### Financial Schema

| Table | Purpose |
|---|---|
| `fee_structures` | Defines what is billed per term (either globally or tied to a `class_id`). |
| `invoices` | Monthly/Termly bill generated per student. Contains `balance` and `status` (`unpaid \| partial \| paid`). |
| `invoice_items` | Line items defining an invoice breakdown (e.g. "Tuition", "Transport"). |
| `fee_payments` | Ledger of successfully received payments. |
| `mpesa_stk_requests` | Tracks Daraja API push states (`checkout_request_id`, `status`). |
| `salary_advances` | Tracks staff requests for mid-month advances. |

---

### Ancillary Schema

| Table | Purpose |
|---|---|
| `inventory_ledger` | Basic check-in/check-out log for the `storekeeper`. |
| `bus_routes` | Transport logistics tracking. |


---

### Communications Schema (`20260629000002_communications.sql`)

| Table | Purpose |
|---|---|
| `announcements` | Broadcast messages from admin/principal to selected audiences (All, Parents, Staff, Teachers). Scoped by `school_id`. |
| `conversations` | A thread between two users in the same school. |
| `conversation_participants` | M2M join tracking which users belong to which conversation and when they last read it. |
| `messages` | Individual messages in a conversation. Contains `sender_id`, `content`, `created_at`. |

> **Messaging Enhancement (`20260728000000`):** `messages.is_read` (boolean, default `false`) was added to power unread badge counts and double-tick read receipts. Index added on `(conversation_id, is_read)`.

---

### Notifications Schema (`20260728000001_notifications.sql`)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → `users` | |
| `title` | text | Short title for popup header |
| `message` | text | Full body shown after "Read" is pressed |
| `type` | text | e.g. `system`, `payment`, `message` |
| `link` | text | Nullable — navigation target |
| `action_label` | text | Nullable — label for contextual CTA button |
| `action_href` | text | Nullable — href for contextual CTA button |
| `is_read` | boolean | Drives bell badge count; set to `true` on popup "Read" |
| `created_at` | timestamptz | |

RLS: users can only `SELECT`, `UPDATE`, and `DELETE` their own rows. Server inserts use service-role client. Realtime enabled for the `GlobalNotificationPopup`.

> **Automated Cleanup:** Notifications that are `is_read = true` and older than 3 months are purged nightly via `pg_cron` (uncomment in migration to activate).

[Link: /admin/dashboard]
