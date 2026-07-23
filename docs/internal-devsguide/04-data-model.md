# Data Model

EduTrack utilizes a strictly relational schema built on PostgreSQL, utilizing UUIDs for all primary keys.

## Core Entities
- **`schools`**: The root tenant object. Everything belongs to a school.
- **`users`**: All human actors (Admin, Principal, Teachers, Parents, Bursar, etc.). Their access is dictated by the `role` enum.
- **`invitations`**: Handles the delegated onboarding tokens. Maps a token to a specific role and target (e.g., linking an invited Parent to a specific `student_id`).

## Academic Entities
- **`classes`**: E.g., "Grade 1". Linked to a `class_teacher_id`.
- **`students`**: The core academic subject. Contains `admission_number`.
- **`student_parents`**: A bridging table (Many-to-Many) linking `students` to `users` (where role is `parent`). This allows one parent to have multiple children, and a child to have multiple guardians.
- **`subjects`**: E.g., "Mathematics". Linked to a `teacher_id` (Subject Teacher).

## Grading & Attendance
- **`attendance`**: Logs daily presence. Contains `status` ('Present', 'Absent', 'Late').
- **`exams`**: Defines an assessment period (e.g., "Term 1 Mid-Term") with a `max_score`.
- **`exam_results`**: The actual grades. 
  - *Tech Debt Note:* Currently supports simple `score numeric` and `grade text`. Does not yet support the complex CBC rubric structures outlined in the PRD.

## Financial Entities
- **`academic_terms`**: Defines the financial/academic period.
- **`fee_structures`**: Defines what should be billed for a specific term, either globally for the school or specific to a `class_id`.
- **`invoices`**: The actual bill sent to a student. Contains `amount` and `balance`.
- **`invoice_items`**: Line items for an invoice (e.g., "Tuition: 5000", "Transport: 2000").
- **`fee_payments`**: Ledger of received payments, linking to `mpesa_receipt`.
- **`mpesa_stk_requests`**: Tracks the state of initiated STK pushes.

## Ancillary Services
- **`inventory_ledger`**: Logs items checking IN (positive `quantity_change`) and OUT (negative `quantity_change`) for the storekeeper.
- **`bus_routes`**: Logs transport logistics.
- **`salary_advances`**: Tracks staff requests for mid-month advances.

## Communications
- **`announcements`**: Global broadcasts to specific audiences (e.g., 'Parents', 'Teachers').
- **`conversations` & `messages`**: Direct messaging threads between users (e.g., Parent to Class Teacher).
