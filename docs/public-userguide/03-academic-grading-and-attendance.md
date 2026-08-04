# Academic Grading, Examinations & Timetable

**Goal:** Manage school-wide timetables, define grade boundaries, conduct multi-class exam events, and execute the two-tier teacher approval workflow for student report cards.

*This guide is for Administrators, Class Teachers, Subject Teachers, and Parents.*

---

## 1. School-Wide Timetable Management

The timetable in EduTrack is controlled centrally at the Grand School Admin level.

### Administrator Setup:
1. Navigate to **Timetable**. [Link: /dashboard/timetable]
2. **Bell Schedule:** Click **Setup Bell Schedule** to define periods (start/end times) and break intervals school-wide.
3. **Timetable Builder:** Switch to the **Grid Builder** tab.
   - Select a Class and Day of Week.
   - Assign Subject and Teacher to each period slot.
   - Real-time conflict detection alerts you if a teacher is double-booked across another class or period.
4. **Publishing:** Click **Publish Timetable** to release the schedule to teachers and parents.

### Teacher & Parent Access:
- **Teachers:** Navigate to **My Timetable** [Link: /teacher/timetable] to view your personal teaching schedule (Subject Teachers) or full class schedule (Class Teachers).
- **Parents:** Navigate to **Class Timetable** [Link: /parent/academics/timetable] to view the weekly published timetable for all linked children.

---

## 2. School-Wide Grading Engine

Administrators set global grade scale boundaries used for automatic score-to-grade assignment.

1. Navigate to **Grading Engine**. [Link: /dashboard/grading]
2. Click **Add Grade** to define grade symbols (e.g., A, B+), score ranges (min/max score), GPA points, and remarks (e.g., Distinction, Pass).
3. The visual coverage bar checks for gaps in score ranges from 0 to 100 marks.

---

## 3. Examination & Grading Approval Workflow

EduTrack enforces a strict 3-stage examination workflow: **Draft Entry → Class Teacher Review → Admin Publication**.

### Step 1: Exam Event Creation (Admin)
1. Go to **Examinations**. [Link: /dashboard/exams]
2. Click **New Exam Event**.
3. Select Academic Year, Term, and Participating Classes.
4. Click **Publish** to open mark entry for subject teachers.

### Step 2: Mark Entry & Auto-Grading (Subject Teacher)
1. Go to **Results Entry**. [Link: /teacher/grades]
2. Select the Exam Event, Class, and Subject.
3. Enter student scores. The system auto-saves each row and assigns letter grades based on the school's Grade Scale.
4. Click **Submit for Review**. Once submitted, the mark entry locks to prevent unauthorized edits.

### Step 3: Review & Verification (Class Teacher)
1. Go to **Results Review**. [Link: /teacher/grades] (Class Teacher Portal)
2. View submitted subject marks for your class.
3. Review scores and tap **Approve** or **Reject** (with mandatory feedback comment for correction).

### Step 4: Report Card Generation (Admin & Parent)
1. In **Examinations → Monitor**, administrators view real-time progress across all classes and subjects.
2. Click **Generate Report Cards** once all subjects are approved.
3. **Parents** can view published report cards under **Report Cards** [Link: /parent/results], including class rank, overall grade, and subject breakdowns.
