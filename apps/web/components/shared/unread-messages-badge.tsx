'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UX } from '@/lib/ux'

export function UnreadMessagesBadge() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let userId: string | null = null

    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      const { data: myConvos } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('user_id', user.id)

      if (myConvos && myConvos.length > 0) {
        // Count messages newer than user's last_read_at per conversation
        let total = 0
        await Promise.all(
          myConvos.map(async (cp: any) => {
            const { count: unread } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('conversation_id', cp.conversation_id)
              .neq('sender_id', user.id)
              .gt('created_at', cp.last_read_at ?? '1970-01-01')
            total += unread ?? 0
          })
        )
        setCount(total)
      }
    }

    loadUnread()

    const channel = supabase
      .channel('unread-messages-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (userId && payload.new?.sender_id && payload.new?.sender_id !== userId) {
            setCount(prev => prev + 1)
            supabase.from('users').select('full_name').eq('id', payload.new.sender_id).single().then(({ data }) => {
              UX.toast(`New message from ${data?.full_name || 'a colleague'}`)
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (userId && payload.new?.sender_id !== userId && payload.new?.is_read) {
            // Re-fetch to guarantee accuracy and avoid race conditions
            loadUnread()
          }
        }
      )
      .subscribe()

    window.addEventListener('messages-read', loadUnread)

    return () => { 
      supabase.removeChannel(channel)
      window.removeEventListener('messages-read', loadUnread)
    }
  }, [supabase])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-card">
      {count > 9 ? '9+' : count}
    </span>
  )
}
