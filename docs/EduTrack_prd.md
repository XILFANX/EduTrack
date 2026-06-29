# EduTrack — Product Requirements Document

**Version 1.0**
**Stack:** Monorepo (Next.js + React Native / Expo) + Supabase + M-Pesa Integration
**Status:** Inception / Planning

---

## 1. Executive Summary

EduTrack is a premium, automated school management system inspired by the robust architecture of EstateTrack. It serves as a unified digital infrastructure for modern schools, connecting administrators, teaching staff, and parents into a single, cohesive platform. 

The system brings the "EstateTrack philosophy" to education: replacing fragmented WhatsApp groups, paper report cards, and manual fee ledgers with a sleek, automated, single source of truth.

---

## 2. User Roles & Permissions

EduTrack utilizes a 9-tier role architecture, securely isolated via Supabase Row Level Security (RLS).

| Role | Description & Access Level |
| ---- | -------------------------- |
| **Admin (Platform Owner)** | Oversees the entire SaaS platform. Manages school subscriptions, views global analytics, and monitors system health across all registered schools. |
| **School Head (Principal)** | The "Landlord" of their school. Has grand overview and full control of students, teachers, classes, finances, and the library. Responsible for **onboarding all teaching and non-teaching staff**. |
| **Class Teacher** | The "Caretaker" of a specific class. Full overview of their assigned students, attendance tracking, and general class performance. Responsible for **onboarding parents** of students in their class to distribute the administrative load. |
| **Subject Teacher** | Focused scope. Controls and enters grades/assessments only for the specific subjects and classes they are assigned to teach. |
| **Bursar** | The financial controller. Manages fee structures, automated invoicing, M-Pesa integrations, and receipt generation. |
| **Librarian** | Manages the library inventory, tracks book issues, and logs late returns/lost books. |
| **Storekeeper** | Manages school kitchen and stationery inventory. Logs daily check-ins and check-outs to prevent theft and track consumption. |
| **Transport Matron** | Manages bus routes, monitors student pickups/drop-offs, and ensures safety protocols during transit. |
| **Parent** | The "Tenant". A read-only portal to view their child's (or multiple children's) academic performance, attendance records, disciplinary logs, and pay fees seamlessly via M-Pesa. |

---

## 3. Recommended Core Features (Borrowed & Enhanced from EstateTrack)

### 3.1 Seamless, Delegated Onboarding (Token Invites)
To prevent administrative bottlenecks, onboarding is decentralized:
- **School Head** generates secure invite links to onboard Staff (Teachers, Bursar, Librarian).
- **Class Teachers** generate secure invite links to onboard Parents for their specific class.
Parents click the link, verify their phone number, and are instantly logged in without needing to create complex passwords.
**Bonus Enhancement:** Multi-student linking. A parent with three children in the school will see all three profiles under a single portal login.

### 3.2 Granular, TradingView-Style Analytics
Because education and school administration is heavily data-driven, EduTrack features advanced, granular charting (inspired by financial tools like TradingView). 
- **School Head Dashboard:** View school-wide performance curves, financial cash-flow velocity, and attendance trends over time using interactive candlestick or line charts.
- **Class Teacher Dashboard:** Granular drill-downs into individual student performance trajectories across subjects to quickly identify drops in performance.

### 3.3 Automated Fee Engine & M-Pesa (The "Rent" Engine)
- **Automated Fee Invoices:** Automatically generate termly fee invoices for every student.
- **M-Pesa STK Push:** Parents can click "Pay Fees" in their portal, triggering an M-Pesa STK push.
- **C2B Auto-Reconciliation:** When a parent pays via Paybill, the system automatically matches the payment to the student's ID and generates a digital PDF receipt.

### 3.4 The Library-Bursar Bridge
When the Librarian flags a book as lost or heavily overdue, the system automatically communicates with the Bursar's module to add a "Library Fine" line item to that student's next fee invoice. No manual cross-department communication required.

### 3.5 Automated WhatsApp Notifications
Leveraging the EstateTrack notification engine:
- **Attendance Alerts:** If a class teacher marks a student absent, an automated WhatsApp message is instantly sent to the parent.
- **Fee Reminders:** Automated nudges to parents when fee balances are overdue.
- **Grade Publishing:** Notifications sent to parents when end-of-term report cards are generated and available for download.

### 3.6 Dynamic PDF Report Cards
Automatically compile the grades entered by various Subject Teachers into a beautifully designed, downloadable PDF report card, complete with the Principal's digital signature and school letterhead.

### 3.7 Health & Discipline Log
A module for the School Head / Class Teachers to log minor disciplinary incidents or sick bay visits, providing parents with a transparent timeline of their child's well-being.

### 3.8 Flexible Grading Engine (CBC vs. 8-4-4 / IGCSE)
Built to natively support both rigid numeric grading (8-4-4/IGCSE) and rubric-based competency evaluations (Kenya CBC). The grading schema dynamically adapts based on the school's configured curriculum, preventing technical debt as national curriculums shift.

### 3.9 Basic Store & Kitchen Inventory Ledger
To plug the biggest financial leak in schools (theft of supplies), a simple In/Out ledger allows the Storekeeper to log daily consumption of maize, beans, cooking oil, and stationery. The Principal views real-time balances and depletion curves on their dashboard.

### 3.10 Transport & Bus Route Roster
Digital rostering for school transport. Students are assigned to bus routes, and the Transport Matron marks them as boarded/alighted via their mobile portal. Gives the Principal immediate oversight of transport logistics.

### 3.11 Automated Clearance & Leaving Certificates
When a student graduates or transfers, the system automatically checks for pending fee balances and unreturned library books. If cleared, it unlocks a one-click PDF generation of the official School Leaving Certificate.

### 3.12 Staff Salary Advances Tracking
A specialized ledger within the Bursar's module specifically to log mid-month salary advances for teachers and support staff. Automatically aggregates into a payroll deduction report at month-end.

---

## 4. Product Architecture & Stack

EduTrack will utilize the exact same highly scalable monorepo structure as EstateTrack to ensure rapid development and code sharing.

- **Monorepo Layout:**
  - `apps/web/`: Next.js 16 (App Router) for the Admin, Principal, Bursar, Librarian, and Teacher portals.
  - `apps/mobile/`: Expo React Native app for Parents (and optionally Teachers).
  - `backend/supabase/`: Supabase Edge Functions, database schemas, migrations.
  - `packages/shared/`: Shared TypeScript types, utility functions, and UI components.
- **UI/UX:** TailwindCSS v4 with shadcn/ui. The design language will mirror EstateTrack's "premium feel" but with a distinct, education-focused color palette (e.g., deep blues and crisp whites).
- **Security:** Strict Supabase Row Level Security (RLS) ensuring a Parent only ever sees data linked to their `parent_id`, and a Teacher only modifies grades for their assigned `subject_id`.

---

## 5. Subscription Tiers (SaaS Model)

The Admin charges schools based on student enrollment limits:
- **Trial:** Up to 50 students (Free to test).
- **Basic:** Up to 300 students.
- **Standard:** Up to 800 students.
- **Premium:** Unlimited students.
