# Module: Teacher Portal

## Purpose
The interface for academic staff to manage attendance, input grades, and communicate with parents.

## Public Interface
- **Access Route:** `/teacher/*`
- **Role Requirement:** `class_teacher` or `subject_teacher`

## Implementation Notes
- **Role Distinction:** A `class_teacher` has broader read access to attendance and overall performance for their assigned `class_id`, as well as the ability to generate parent invites for students in their class. A `subject_teacher` is restricted to inputting `exam_results` for their specific `subject_id`.
- **Grade Input:** The current implementation allows teachers to insert and update `public.exam_results`. 

## Dependencies
- Writes to: `public.attendance`, `public.exam_results`, `public.invitations` (parents only).
- Reads from: `public.students`

## Known Limitations / Tech Debt
- The grading UI only supports numeric scores. Needs a UI overhaul when the backend is upgraded to support CBC rubric evaluations.
