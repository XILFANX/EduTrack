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

> **Missing Tables:** There is currently no database schema for Library Inventory, Fines, or Health/Discipline logs, despite PRD mentions.

[Link: /admin/dashboard]
