# Messaging and Broadcasting Module

## Overview
The Messaging and Broadcasting module provides unified communication features across the platform. It features two primary capabilities:
1. **Direct Messaging (DMs)**: Real-time, 1-to-1 conversations between users based on role permissions.
2. **Broadcasts (Announcements)**: One-to-many communication directed at specific audiences (e.g., all parents, specific class, all staff).

## Architecture

### Components
- `ChatClient`: The core chat interface handling contact selection, message history, real-time subscriptions, and read receipts.
- `MessagesLayout`: A unified, tabbed layout container that houses both the `ChatClient` and the Announcements capabilities. This layout is reused across Admin, Teacher, Parent, and Specialty Staff portals.
- `AnnouncementsFeed`: A visual feed of announcements relevant to the logged-in user. Includes support for deleting announcements for authors.
- `AnnouncementsClient`: The compose interface for creating new broadcasts, allowing targeting specific audiences.
- `UnreadMessagesBadge`: A global badge component that listens for incoming unread messages and displays a real-time count. It also triggers `UX.toast` notifications globally when a new message arrives.

### Data Model
- **`conversations`**: Tracks 1-to-1 chat threads.
- **`conversation_participants`**: Links users to conversations and tracks `last_read_at`.
- **`messages`**: Contains the message content, `sender_id`, and a new `is_read` boolean column for read receipts.
- **`announcements`**: Stores broadcast messages with `target_audience` and `author_id`.

## Security & Permissions (Role-Based Access)

Communication is heavily segregated to prevent inappropriate contact:
- **Parents**: Can only message their children's teachers and School Admins. They cannot broadcast.
- **Teachers**: Can message parents of their students, other staff, and School Admins. Class teachers can broadcast to their class's parents.
- **Admins**: Can message anyone and broadcast to any audience.
- **Specialty Staff (Bursar, etc.)**: Can message staff and parents, but cannot broadcast.

Admins are grouped under the single umbrella "School Admin" or "EstateTrack Support" in the user interface to preserve anonymity and provide a unified support channel.

## Real-time & UX
- Real-time is powered by Supabase Postgres Changes.
- `UX.toast` is integrated directly into the real-time listeners to provide non-intrusive alerts for incoming messages regardless of the user's current page.
- Message status ticks (single grey tick = pending/sent, double blue/cyan tick = read) are fully supported via the `is_read` property on messages.
