'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Trash2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type Notification = {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  action_href: string | null
  is_read: boolean
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    async function loadNotifications() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data && !('error' in data && data.error === true)) {
        setNotifications(data as unknown as Notification[])
      }
      setLoading(false)
    }

    loadNotifications()

    const channel = supabase
      .channel('public:notifications:center')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function markAsRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    window.dispatchEvent(new CustomEvent('notifications-read'))
  }

  async function openNotification(notif: Notification) {
    if (!notif.is_read) {
      window.dispatchEvent(new CustomEvent('open-notification', { detail: notif }))
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    window.dispatchEvent(new CustomEvent('notifications-read'))
  }

  async function deleteAll() {
    if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) return
    setNotifications([])
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('notifications').delete().eq('user_id', user.id)
    }
  }

  function getAdjustedLink(link: string | null): string | null {
    if (!link) return null
    const segments = pathname.split('/').filter(Boolean)
    const portal = segments[0]
    const validPortals = ['admin', 'dashboard', 'teacher', 'parent', 'student', 'bursar', 'library', 'store', 'transport']
    if (validPortals.includes(portal) && !link.startsWith(`/${portal}`)) {
      return `/${portal}${link.startsWith('/') ? link : '/' + link}`
    }
    return link
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading notifications...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-cyan-600" />
            Notification Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your alerts and system messages.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors text-slate-700 dark:text-slate-300"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all read
          </button>
          <button 
            onClick={deleteAll}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete all
          </button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground">You're all caught up!</h3>
          <p className="text-muted-foreground mt-2">No new notifications at the moment.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm divide-y divide-border">
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-5 transition-colors sm:flex sm:items-start gap-4 cursor-pointer ${n.is_read ? 'bg-transparent' : 'bg-cyan-50/50 dark:bg-cyan-950/20'}`}
              onClick={() => openNotification(n)}
            >
              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 hidden sm:block ${n.is_read ? 'bg-transparent' : 'bg-cyan-600'}`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className={`text-base font-semibold ${n.is_read ? 'text-foreground/80' : 'text-foreground'}`}>
                      {n.title}
                    </h4>
                    <p className={`mt-1 text-sm ${n.is_read ? 'text-muted-foreground' : 'text-slate-700 dark:text-slate-300'} leading-relaxed`}>
                      {n.message}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap hidden sm:block">
                    {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[10px] text-muted-foreground mt-3 sm:hidden">
                  {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>

                {(n.action_href || n.link) && n.is_read && (
                  <div className="mt-4">
                    <Link 
                      href={getAdjustedLink(n.action_href || n.link)!}
                      className="inline-flex px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Details
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
