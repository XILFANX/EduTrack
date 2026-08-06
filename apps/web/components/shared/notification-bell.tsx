"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  is_read: boolean
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data && !('error' in data && data.error === true)) {
        setNotifications(data as unknown as Notification[])
      }
      setLoading(false)
    }

    loadNotifications()

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 10))
        }
      )
      .subscribe()

    const handleReadEvent = () => loadNotifications()
    window.addEventListener('notifications-read', handleReadEvent)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('notifications-read', handleReadEvent)
    }
  }, [supabase])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function getAdjustedLink(link: string): string {
    const segments = pathname.split('/').filter(Boolean)
    const portal = segments[0]
    const validPortals = ['admin', 'dashboard', 'teacher', 'parent', 'student', 'bursar', 'library', 'store', 'transport']
    if (validPortals.includes(portal)) {
      return `/${portal}${link}`
    }
    return link
  }

  return (
    <Link 
      href={getAdjustedLink('/notifications')}
      className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50 inline-flex items-center justify-center"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-600"></span>
        </span>
      )}
    </Link>
  )
}
