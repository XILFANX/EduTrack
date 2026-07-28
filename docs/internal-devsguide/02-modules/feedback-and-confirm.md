# Global Feedback & Confirmation Dialog

**Location:** `components/ui/feedback-toast.tsx` · `lib/feedback.tsx` · `components/providers/confirm-provider.tsx`

This is a single, centralized module. You build it once and call it from anywhere — the UI card is rendered from one place, and each call site supplies its own message.

---

## Event Feedback Toaster

### Files
| File | Role |
|------|------|
| `components/ui/feedback-toast.tsx` | The card component rendered inside the toast |
| `lib/feedback.tsx` | Exported utility functions — `showFeedback()` and `showError()` |
| `app/layout.tsx` | Mounts the `<Toaster>` globally — nothing per-page needed |

### Usage

```typescript
'use client'  // ← MUST be line 1, before any import
import { showFeedback, showError } from '@/lib/feedback'

// Success — after any positive event
showFeedback({ title: 'Student enrolled!' })

// With description
showFeedback({
  title: 'Attendance saved',
  description: '32 records submitted for Monday.'
})

// With an inline action button on the card itself
showFeedback({
  title: 'Timetable updated',
  description: 'Changes saved for Monday.',
  action: { label: 'View', onClick: () => router.push('/dashboard/timetable') }
})

// Error
showError({ title: 'Failed to save', description: 'Please check your connection.' })
showError('Something went wrong')  // shorthand string form
```

### Design Spec
- Card: `bg-slate-900`, `border-slate-800`, `rounded-2xl`, 360px wide
- Top accent stripe: **blue-500** (success) · **red-500** (error)
- Icon ring: **blue-500/10** (success) · **red-500/10** (error)
- Duration: 5 000 ms success · 7 000 ms error
- Position: top-right

---

## Confirmation Dialog

### Files
| File | Role |
|------|------|
| `components/providers/confirm-provider.tsx` | Global context + rendered `<AlertDialog>` |
| `app/layout.tsx` | Mounts `<ConfirmProvider>` wrapping the whole app |

### Usage

```typescript
'use client'
import { useConfirm } from '@/components/providers/confirm-provider'

export function MyComponent() {
  const confirm = useConfirm()

  async function handleDeleteStudent(id: string) {
    const ok = await confirm({
      title: 'Delete student?',
      description: 'This will permanently remove the student and all associated records.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      variant: 'destructive'   // red confirm button
    })
    if (!ok) return            // user cancelled — stop here

    await deleteStudent(id)
    showFeedback({ title: 'Student deleted' })
  }
}
```

### Options

| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `title` | `string` | — | Required |
| `description` | `string` | — | Optional supporting text |
| `confirmText` | `string` | `'Confirm'` | Label for the confirm button |
| `cancelText` | `string` | `'Cancel'` | Label for the cancel button |
| `variant` | `'default' \| 'destructive'` | `'default'` | `'destructive'` = red button |

### Design Spec
- Card: `bg-slate-900`, `rounded-3xl`, max-width `sm`
- Icon: amber warning triangle, 56px ring
- Cancel button: `slate-800`
- Confirm (default): **blue-600**
- Confirm (destructive): **red-600**

---

## Events Currently Wired

| Component | Event | Type |
|-----------|-------|------|
| `components/admin/optimization-client.tsx` | Cache purge success/fail | feedback |
| `components/shared/students/students-client.tsx` | Student removed/deleted | feedback |
| `app/admin/admins/create-admin-modal.tsx` | Admin created | feedback |
| `app/admin/schools/create-school-modal.tsx` | School registered | feedback |
| `app/dashboard/classes/add-class-modal.tsx` | Class created | feedback |
| `app/dashboard/classes/classes-client.tsx` | Class deleted | feedback |
| `app/dashboard/classes/[id]/class-detail-client.tsx` | Class deleted | feedback |
| `app/dashboard/exams/grade-scales-manager.tsx` | Grade scale CRUD | feedback |
| `app/dashboard/grading/grading-client.tsx` | Grade scale CRUD | feedback |
| `app/dashboard/staff/staff-page-client.tsx` | Staff removed / invite copied | feedback |
| `app/dashboard/subjects/add-subject-modal.tsx` | Subject saved | feedback |
| `app/dashboard/subjects/subject-client.tsx` | Subject / teacher CRUD | feedback |
| `app/dashboard/timetable/timetable-builder.tsx` | Period / slot CRUD | feedback |
| `app/store/log-stock-modal.tsx` | Stock logged | feedback |
| `app/teacher/attendance/attendance-client.tsx` | Attendance saved | feedback |
| `app/teacher/discipline/discipline-client.tsx` | Discipline log added | feedback |
| `app/teacher/grades/grades-client.tsx` | Grades saved | feedback |
| `components/shared/user-nav.tsx` | Log out | confirm (destructive) |

---

## Adding Feedback to a New Event

1. Ensure `'use client'` is **line 1** of the file (before any import — Next.js enforces this strictly).
2. Import the utility:
   ```typescript
   import { showFeedback, showError } from '@/lib/feedback'
   ```
3. Call on outcome:
   ```typescript
   const result = await someAction(data)
   if (result.error) {
     showError({ title: 'Failed', description: result.error })
   } else {
     showFeedback({ title: 'Done!' })
   }
   ```

## Adding a Confirm to a New Destructive Action

1. Import and call the hook:
   ```typescript
   import { useConfirm } from '@/components/providers/confirm-provider'
   const confirm = useConfirm()
   ```
2. Await before executing:
   ```typescript
   const ok = await confirm({ title: 'Are you sure?', variant: 'destructive' })
   if (!ok) return
   ```

---

## ⚠️ Known Gotcha — `'use client'` Ordering

When adding the feedback import to an existing client component, always put `'use client'` on the very first line:

```typescript
// ✅ Correct
'use client'
import { showFeedback } from '@/lib/feedback'
import { useState } from 'react'

// ❌ Will break the build
import { showFeedback } from '@/lib/feedback'
'use client'
import { useState } from 'react'
```

Next.js throws `The "use client" directive must be placed before other expressions` if any import precedes it. Files with a UTF-8 BOM (`﻿`) prepended by a text editor are especially vulnerable to this — always check line 1 is clean.
