# Messaging and Broadcasting Module

## Overview
The Messaging and Broadcasting module provides unified communication features across the platform. It features two primary capabilities:
1. **Direct Messaging (DMs)**: Real-time, 1-to-1 conversations between users based on role permissions.
2. **Broadcasts (Announcements)**: One-to-many communication directed at specific audiences (e.g., all parents, specific class, all staff).

## Architecture

### Components
- `ChatClient` (`apps/web/components/shared/chat-client.tsx`): The core chat interface handling contact selection, message history, real-time subscriptions, and read receipts.
- `MessagesLayout`: A unified, tabbed layout container that houses both the `ChatClient` and the Announcements capabilities. This layout is reused across Admin, Teacher, Parent, and Specialty Staff portals.
- `AnnouncementsFeed`: A visual feed of announcements relevant to the logged-in user. Includes support for deleting announcements for authors.
- `AnnouncementsClient`: The compose interface for creating new broadcasts, allowing targeting specific audiences.
- `UnreadMessagesBadge` (`apps/web/components/shared/unread-messages-badge.tsx`): A global badge component that listens for incoming unread messages and displays a real-time count. It also triggers `UX.toast` notifications globally when a new message arrives.
- `GlobalNotificationPopup` (`apps/web/components/shared/global-notification-popup.tsx`): A centered popup (matches existing confirmation dialog style) that appears when any new notification row is inserted for the current user. Provides **Read** (expand and mark read) and **Later** (dismiss, increment bell badge) actions, plus optional contextual CTA button (`action_label` / `action_href`).
- `NotificationBell` (`apps/web/components/shared/notification-bell.tsx`): Bell icon in each portal's top nav. Shows a live unread count badge. Navigates to `/[portal]/notifications` on click.
- `NotificationCenter` (`apps/web/app/[portal]/notifications/page.tsx`): Per-portal notification history page. Lists all notifications in timestamp order with bulk delete action.

### Data Model
- **`conversations`**: Tracks 1-to-1 chat threads.
- **`conversation_participants`**: Links users to conversations and tracks `last_read_at`.
- **`messages`**: Contains the message content, `sender_id`, and `is_read` boolean for read receipts. (`migration: 20260728000000_messaging_enhancement.sql`)
- **`announcements`**: Stores broadcast messages with `target_audience` and `author_id`.
- **`notifications`**: Per-user notification rows with `title`, `message`, `type`, `link`, `action_label`, `action_href`, `is_read`. (`migration: 20260728000001_notifications.sql`)

### Cross-Tab State Sync

Two custom DOM events keep badge counts consistent across tabs and components without a shared state manager:

| Event | Fired By | Handled By |
|---|---|---|
| `messages-read` | `ChatClient` (on opening a conversation) | `UnreadMessagesBadge` (resets count) |
| `notifications-read` | `NotificationCenter` (bulk read action) | `NotificationBell` (refreshes count) |
| `open-notification` | `GlobalNotificationPopup` (bell click forwarding) | `GlobalNotificationPopup` (opens read panel) |

## Security & Permissions (Role-Based Access)

See `docs/internal-devsguide/05-multi-tenancy-and-security.md` for the full Role-Permission Matrix.

Communication is heavily segregated to prevent inappropriate contact:
- **Product Admin**: Can only message clients (Schools/Principals). Displayed as "EduTrack Support" to school-level users.
- **Principals / Headteachers**: Can message all school staff and parents; can broadcast to all audiences. They also have an exclusive `EduTrack Support` directory entry. Other school admins (Admin/Principal/Headteacher roles) are filtered out of each admin's contact list so they do not appear as peers.
- **Teachers**: Can message parents of their assigned students, other staff, and school admins.
- **Bursar**: Can message staff and parents.
- **Parents**: Can message their child's class teacher, subject teachers, and bursar.

Admins are presented to non-admin users contextually (e.g., "EduTrack Support", "Class Teacher (John Doe)") to provide intuitive support channels. Role filtering is strictly **case-insensitive** across all directories to prevent mismatches resulting in empty categories.

## Real-time & UX

- Real-time is powered by Supabase Postgres Changes subscriptions on `messages` (filtered by `conversation_id`) and `notifications` (filtered by `user_id`).
- `UX.toast` is integrated directly into the real-time listeners to provide non-intrusive alerts for incoming messages regardless of the user's current page.
- Message status ticks (single grey tick = pending/sent, double cyan tick = read) are fully supported via the `is_read` property on messages. Failed messages are kept in UI with a red `is_failed` warning instead of disappearing.

## Clear Chat (Soft-Delete via localStorage)

"Clear Chat" uses a **client-side soft-delete** backed by `localStorage`:
1. When confirmed, `localStorage.setItem('cleared_chat_${conversationId}_${userId}', new Date().toISOString())` records a `cleared_at` timestamp.
2. On next load, messages are filtered: only messages with `created_at` **after** `cleared_at` are shown.
3. Incoming realtime messages older than `cleared_at` are silently dropped.
4. The other participant's view is completely unaffected.
5. The confirmation dialog uses the app's `ConfirmDialog` / `useConfirmDialog()` system — **never** `window.confirm`.

> **Why not a database column?** This avoids a schema migration and RLS changes while still persisting the cleared state across refreshes. A `cleared_at_user1` / `cleared_at_user2` column pair on `conversations` would be the database-native alternative if a future requirement demands server-side enforcement.

## Unread Badge Persistence

The badge count is backed by `messages.is_read`. When a conversation is opened, `markConversationAsRead` (in `app/actions/chat.ts`) performs **two** atomic writes using the admin client (to bypass RLS):
1. `conversation_participants.last_read_at = now()` — for future reads without a full table scan.
2. `messages.is_read = true` WHERE `conversation_id = ? AND sender_id != currentUser` — this is the authoritative source the badge query reads from.

Without step 2, the badge re-appears on page refresh because the query reads `messages.is_read`, not `last_read_at`.

## Typing Indicator Staleness

Typing state is broadcast via the Supabase Presence channel (`chat_presence`). A user's presence state includes an `online_at` timestamp (refreshed on each keypress). To prevent stale "is typing..." indicators when a user abruptly disconnects or stops typing without a final sync event, the `chat-client.tsx` implements a local `setInterval` garbage collector. This interval polls the local presence state every 1,000ms. Any user whose `online_at` timestamp is older than 5,000ms is automatically and instantly removed from the typing UI.

## Last Seen Format

The application enforces a strictly binary "Online" or "Offline" status for users. The `formatLastSeen` function does not attempt to calculate or display explicit "last seen at 5:40 PM" timestamps to avoid UX confusion. A dynamic `● Online` badge is displayed when a user is actively in the `chat_presence` channel; otherwise, they are designated as `● Offline`.

## Theme Tokens

The module enforces app-level brand colors for all interactive states:
- **EduTrack**: `cyan-500` for Online status, typing indicator, success feedback, and read ticks.
- **EstateTrack**: `purple-500` for the same elements.

These are applied in `chat-client.tsx` and `announcements-client.tsx` within each app's `apps/web/components/shared/` directory. Any deviation (e.g. `cyan-500`, `green-500`) is a bug.

## Directory Sync (classIds)

For staff portals (Teacher, Bursar, Library, Store, Transport), parents are associated to their child's class via a `classIds: string[]` field on each contact object. This field is built in the server page (`app/[portal]/messages/page.tsx`) by:
- Querying `student_parents` links for all parent contacts.
- Mapping each parent to the `class_id` of their linked students (`student_classes` relationship).
- Assigning `classIds: [cls.id, ...]` directly into the contact object.

The `ChatClient` uses `classIds` to filter contacts when the user drills into a specific class folder. If `classIds` is missing on a parent contact, they will appear in the top-level parent count but not inside any class folder — this is the "folder says 1 member, opens to show 0" bug. This mapping logic must be present in every staff portal that allows filtering parents by class.

## Broadcast Deletion Cache Invalidation

`deleteAnnouncement` in `app/actions/chat.ts` calls `revalidatePath('/', 'layout')` after the Supabase delete. This busts the Next.js full-route cache so the deleted broadcast does not re-appear on page refresh. Without this call, Next.js serves the stale cached server component output.
