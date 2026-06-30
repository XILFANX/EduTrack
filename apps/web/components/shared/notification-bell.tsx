"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
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
  const [userRole, setUserRole] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    // Load initial notifications
    async function loadNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (profile) setUserRole((profile as any).role)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (data) setNotifications(data as any[] as Notification[])
      setLoading(false)
    }

    loadNotifications()

    // Subscribe to new notifications
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

    return () => {
      supabase.removeChannel(channel)
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

  async function markAsRead(id: string) {
    // Optimistic UI update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    
    // Background DB update
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
  }

  function getAdjustedLink(link: string | null): string | null {
    if (!link) return null
    // Already fully qualified paths
    if (link.startsWith('/tenant/') || link.startsWith('/caretaker/') || link.startsWith('/admin/')) return link
    // Adjust by role
    if (userRole === 'tenant') return `/tenant${link.startsWith('/') ? link : '/' + link}`
    if (userRole === 'caretaker') return `/caretaker${link.startsWith('/') ? link : '/' + link}`
    if (userRole === 'platform_owner') return `/admin${link.startsWith('/') ? link : '/' + link}`
    return link
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-violet-600 hover:text-violet-700 hover:underline font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-2xl mb-2">🔕</p>
                <p className="text-sm text-foreground font-medium">No notifications yet</p>
                <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 transition-colors ${n.is_read ? 'opacity-70 hover:opacity-100 bg-transparent' : 'bg-violet-50/50 dark:bg-violet-950/20'}`}
                    onClick={() => {
                      if (!n.is_read) markAsRead(n.id)
                      setIsOpen(false)
                    }}
                  >
                    {n.link ? (
                      <Link href={getAdjustedLink(n.link)!} className="block group">
                        <div className="flex gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-violet-600'}`} />
                          <div>
                            <p className="text-sm font-semibold text-foreground group-hover:text-violet-600 transition-colors">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/70 mt-2">
                              {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex gap-3 cursor-default">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.is_read ? 'bg-transparent' : 'bg-violet-600'}`} />
                        <div>
                          <p className="text-sm font-semibold text-foreground">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-2">
                            {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
