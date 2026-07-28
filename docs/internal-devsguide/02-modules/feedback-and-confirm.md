# Global UX System (Tiered Feedback & Confirmation)

**Location:** `components/providers/ux-provider.tsx` · `lib/ux.ts`

This is a single, centralized module that handles all user interactions globally. It implements a tiered UX system so we don't overwhelm users with aggressive popups for every minor action.

## 🏗️ Architecture

The system consists of two parts:
1. **`<UXProvider>`** — Sits in `app/layout.tsx` and renders the modals/toasts. It listens for custom events fired by the UX API.
2. **`UX` API & `useConfirm` Hook** — Provides a clean developer interface to trigger these UI components from anywhere (even outside React components).

## 📊 Tiered Feedback Guidelines

Use the appropriate tier depending on the action's importance and the user's focus:

1. **Tier 1 (Major Interactions): Success/Error Modals**
   - **Use case:** Destructive errors, completing a major form (e.g. adding a new student), or actions that require a "Next step" (e.g. "View Report").
   - **Visuals:** Center-screen modal with backdrop blur. Auto-closes after 3.5s if no action button is provided.
2. **Tier 2 (Minor Interactions): Toasts**
   - **Use case:** Incoming chat messages, background task completion, minor state updates (e.g. "Grades saved").
   - **Visuals:** Unobtrusive pill that slides up from the bottom. Auto-closes after 3s.
3. **Tier 3: Confirmation Dialogs**
   - **Use case:** Destructive actions (delete, logout) or actions with significant consequences.
   - **Visuals:** Center-screen modal requiring explicit user choice.

---

## 💻 Usage Guide

### 1. Triggering Feedback (Success, Error, Toast)

Import the `UX` object from `lib/ux`. You can use this **anywhere** (components, server actions wrapped in client helpers, regular TS files).

```typescript
import { UX } from '@/lib/ux'

// 🟢 Tier 1: Success Modal (Auto-closes in 3.5s)
UX.successModal({
  title: 'Student admitted successfully',
  description: 'The student has been added to the registry.'
})

// 🟢 Tier 1: Success Modal WITH Action (Stays open until clicked)
UX.successModal({
  title: 'Report card generated',
  action: {
    label: 'View Report Card',
    onClick: () => router.push(`/reports/${id}`)
  }
})

// 🔴 Tier 1: Error Modal (Requires user to click "Got it")
UX.errorModal('Failed to connect to the database. Please try again.')
// OR
UX.errorModal({
  title: 'Submission Failed',
  description: 'The grade exceeds the maximum allowed points.'
})

// 🔵 Tier 2: Minor Toast (Auto-closes in 3s, non-blocking)
UX.toast('Attendance saved')
```

### 2. Requesting Confirmation

For destructive actions, always request confirmation. Use the `useConfirm` hook.

```tsx
import { useConfirm } from '@/components/providers/ux-provider'

export function DeleteButton() {
  const confirm = useConfirm()

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Delete this student record?',
      description: 'This action cannot be undone. All associated academic history will be lost.',
      confirmText: 'Delete Record',
      variant: 'destructive' // Uses pure red styling (#FF0000)
    })

    if (!ok) return

    // Proceed with deletion...
    await deleteStudent()
    UX.successModal({ title: 'Student record deleted' })
  }

  return <button onClick={handleDelete}>Delete</button>
}
```

## 🎨 Theming

- **EduTrack:** Success modals use a **Cyan/Blue** theme (blue-600 buttons, cyan-500 icons, cyan borders).
- **EstateTrack:** Success modals use a **Violet** theme (violet-600 buttons, violet-500 icons, violet borders).
- **Destructive Actions:** Consistently use pure red (`#FF0000`) across both apps to clearly signal danger.

## ⚠️ Known Gotchas

### 1. `'use client'` Directive Ordering
If a file has a UTF-8 BOM (Byte Order Mark), the `'use client'` directive MUST be the very first thing in the file, bypassing the BOM. If you get a "useState only works in Client Components" error in a file that clearly has `'use client'`, check for invisible BOM characters.

### 2. Hydration
The `UXProvider` uses DOM events (`window.dispatchEvent`). It is safe to call `UX.successModal()` immediately after an async operation, but ensure it runs on the client.
