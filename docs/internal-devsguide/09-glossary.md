# Glossary

Domain terms, acronyms, and internal conventions for the EduTrack codebase.

---

| Term | Definition |
|---|---|
| **Platform Owner / Admin** | The SaaS owner (`admin`). Has no `school_id`. Bypasses tenant isolation to manage school subscriptions via `/admin/dashboard`. |
| **Principal / Headteacher** | The root tenant administrator for a single school. Has access to the `/dashboard` portal and oversight of all operations. |
| **Bursar** | The financial officer of a school. Manages fee structures, generates invoices, and reconciles payments via `/bursar/dashboard`. |
| **Class Teacher** | Manages a specific Class. Responsible for daily attendance and generating Parent invite links. |
| **Subject Teacher** | Teaches specific subjects (e.g., Grade 8 Math). Responsible for entering exam grades for those subjects. |
| **Parent** | A read-only user accessing `/parent/dashboard`. Linked to students via the `student_parents` join table. |
| **school_id** | The UUID scoping all tenant data. Used in every Row-Level Security (RLS) policy. |
| **STK Push** | *SIM Toolkit Push.* M-Pesa feature that sends a PIN prompt directly to a parent's phone to collect school fees. |
| **CBC** | *Competency Based Curriculum.* The Kenyan academic standard. Currently unsupported natively (the system uses raw numeric scores and standard A-E grading). |
| **Academic Term** | A defined block of time (e.g., "Term 1"). Required for automated fee invoice generation and exam grouping. |
| **VAPID** | Protocol for sending Web Push notifications. Keys are stored in `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` env vars. |

[Link: /admin/dashboard]
