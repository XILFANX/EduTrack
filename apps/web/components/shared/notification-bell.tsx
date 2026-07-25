'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'

/**
 * Lightweight notification bell for EduTrack admin.
 * Full realtime notifications require a `notifications` table to be set up.
 */
export function NotificationBell() {
  return (
    <Link
      href="/admin/notifications"
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50 inline-flex items-center justify-center"
    >
      <Bell className="w-5 h-5" />
    </Link>
  )
}
