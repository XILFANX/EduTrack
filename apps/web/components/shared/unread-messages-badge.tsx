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
        .select('conversation_id')
        .eq('user_id', user.id)

      if (myConvos && myConvos.length > 0) {
        const { count: unread } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', myConvos.map(c => c.conversation_id))
          .neq('sender_id', user.id)
          .eq('is_read', false)

        setCount(unread ?? 0)
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
            setCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-card">
      {count > 9 ? '9+' : count}
    </span>
  )
}
