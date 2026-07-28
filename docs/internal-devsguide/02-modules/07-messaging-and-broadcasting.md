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
- **Product Admin**: Can only message school principals/headteachers.
- **Principals / Headteachers**: Can message all school staff and parents; can broadcast to all audiences.
- **Teachers**: Can message parents of their students, other staff, and school admins.
- **Bursar**: Can message staff and parents.
- **Parents**: Can message their child's class teacher, subject teachers, and bursar.

Admins are presented to non-admin users as "School Admin" (masked identity) to provide a unified support channel.

## Real-time & UX
- Real-time is powered by Supabase Postgres Changes subscriptions on `messages` (filtered by `conversation_id`) and `notifications` (filtered by `user_id`).
- `UX.toast` is integrated directly into the real-time listeners to provide non-intrusive alerts for incoming messages regardless of the user's current page.
- Message status ticks (single grey tick = pending/sent, double blue/cyan tick = read) are fully supported via the `is_read` property on messages.
