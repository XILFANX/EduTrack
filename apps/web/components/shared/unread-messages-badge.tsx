'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UnreadMessagesBadge() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let userId: string | null = null

    async function loadUnread() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id

      const { count: unread } = await supabase
        .from('communications')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      setCount(unread ?? 0)
    }

    loadUnread()

    // Subscribe to new messages directed at the current user
    const channel = supabase
      .channel('unread-messages-badge')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => {
          if (payload.new?.receiver_id === userId) {
            setCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'communications' },
        (payload) => {
          // Refresh when messages are marked read
          if (payload.new?.receiver_id === userId && payload.new?.is_read) {
            setCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])

  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-card">
      {count > 9 ? '9+' : count}
    </span>
  )
}
