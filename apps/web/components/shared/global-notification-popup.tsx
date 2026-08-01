'use client'

import { useState, useEffect } from 'react'
import { Bell, X, ChevronDown, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  link: string | null
  action_label: string | null
  action_href: string | null
  is_read: boolean
  created_at: string
}

export function GlobalNotificationPopup() {
  const [pending, setPending] = useState<Notification | null>(null)
  const [expanded, setExpanded] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // 1. Listen for new notifications
    const channel = supabase
      .channel('global-notification-popup')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const notif = payload.new as Notification
          if (!notif.is_read) {
            setPending(notif)
            setExpanded(false)
          }
        }
      )
      .subscribe()

    // 2. Listen for custom event from Notification Center to reopen
    const handleOpenNotification = (e: Event) => {
      const customEvent = e as CustomEvent<Notification>
      if (customEvent.detail) {
        setPending(customEvent.detail)
        setExpanded(false)
      }
    }
    
    // 3. Listen for new chat messages
    const messageChannel = supabase
      .channel('global-chat-popup')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return
          
          if (payload.new.sender_id !== user.id && !payload.new.is_read) {
            // Fetch sender profile name for title
            const { data: sender } = await supabase.from('users').select('full_name').eq('id', payload.new.sender_id).single()
            setPending({
              id: payload.new.id,
              title: `New message from ${sender?.full_name || 'someone'}`,
              message: payload.new.content || 'Sent a message',
              type: 'message',
              link: '/dashboard/messages',
              action_label: 'Reply in Messages',
              action_href: '/dashboard/messages',
              is_read: false,
              created_at: payload.new.created_at
            })
            setExpanded(false)
          }
        }
      )
      .subscribe()

    window.addEventListener('open-notification', handleOpenNotification)

    return () => { 
      supabase.removeChannel(channel)
      supabase.removeChannel(messageChannel)
      window.removeEventListener('open-notification', handleOpenNotification)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!pending) return null

  const handleRead = async () => {
    setExpanded(true)
    // Mark as read in DB based on type
    if (pending.type === 'message') {
      await supabase.from('messages').update({ is_read: true }).eq('id', pending.id)
    } else {
      await supabase.from('notifications').update({ is_read: true }).eq('id', pending.id)
    }
    window.dispatchEvent(new CustomEvent('notifications-read'))
  }

  const handleLater = () => {
    // Dismiss the popup without marking as read — bell badge will still show it
    setPending(null)
    setExpanded(false)
  }

  const handleDismiss = () => {
    setPending(null)
    setExpanded(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              {pending.type === 'message' ? 'Message' : 'Notification'}
            </p>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">{pending.title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview / Full message */}
        <div className="px-5 pb-2">
          {expanded ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{pending.message}</p>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{pending.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-5 py-4 border-t border-slate-100 dark:border-slate-800 mt-2">
          {expanded ? (
            <div className="flex gap-2">
              {(pending.action_href || pending.link) && (
                <Link
                  href={(pending.action_href || pending.link)!}
                  onClick={handleDismiss}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl text-center transition-colors flex items-center justify-center gap-2"
                >
                  {pending.action_label || 'Open'} <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <button
                onClick={handleDismiss}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleRead}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                <ChevronDown className="w-3.5 h-3.5" /> Read
              </button>
              <button
                onClick={handleLater}
                className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
