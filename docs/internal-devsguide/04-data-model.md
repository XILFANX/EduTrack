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
| `country_code` | text | ISO alpha-2, set at onboarding. Determines pricing region. |
| `currency` | text | ISO currency code |

> **Migration note:** Legacy `subscription_plan` and `subscription_status` columns have been replaced by the `subscriptions` table (`20260731000000_regional_pricing_engine.sql`).

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

### Communications Schema (`20260629000002_communications.sql`, `20260730000001_class_groups_and_policies.sql`)

| Table | Purpose |
|---|---|
| `announcements` | Broadcast messages from admin/principal to selected audiences. Scoped by `school_id`. |
| `conversations` | A message thread. `group_type` = `direct` (1-on-1) or `class_group` (automated class group). `class_id` FK links a group to its class. |
| `conversation_participants` | M2M join tracking which users belong to which conversation and `last_read_at`. |
| `messages` | Individual messages. `sender_id`, `content`, `created_at`, `is_read`. |
| `messaging_policies` | Per-school admin toggles for who can initiate conversations (e.g. `parents_can_message_teachers`). One row per school; defaults to permissive. |

**Automated Class Group Triggers (`20260730000001`):**
- `trg_auto_enroll_parent` — fires `AFTER INSERT ON student_parents`. Calls `get_or_create_class_group()` to ensure a class group conversation exists for the student's class, then adds the parent as a participant automatically.
- `trg_auto_update_class_teacher` — fires `AFTER UPDATE OF class_teacher_id ON classes`. Removes the old teacher from the class group and adds the new one.

> **Messaging Enhancement (`20260728000000`):** `messages.is_read` added for badge counts and read-receipt ticks.

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

---

## Regional Pricing Engine (`20260731000000_regional_pricing_engine.sql`)

Shared schema with EstateTrack (same migration file). The engine is product-aware via the `product` column on `plan_bands` and `subscriptions`.

### `plan_bands`
Pricing tiers for EduTrack (per-student count bands). Linked to `country_regions` for local-currency prices.

### `subscriptions`
Live subscription record. Created at school onboarding (status: `trialing`).

| Column | Notes |
|---|---|
| `account_id` | FK → `schools.id` |
| `product` | `edutrack` |
| `current_band_id` | FK → `plan_bands` |
| `status` | `trialing \| active \| past_due \| canceled \| paused` |
| `trial_ends_at` | Default: 90 days from signup (configurable per school) |

> **Engine rule:** Band transitions happen at cycle boundaries only. A 10% headroom buffer delays upgrades. Feature access is **not** gated by band.

[Link: /admin/dashboard]
