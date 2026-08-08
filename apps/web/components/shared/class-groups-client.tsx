'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users2, Send, Loader2, Check, CheckCheck, MessageSquare } from 'lucide-react'
import { sendMessage } from '@/app/actions/chat'

interface GroupConversation {
  id: string
  title: string
  conversationId: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  is_read?: boolean
  is_pending?: boolean
  sender?: { full_name: string; salutation?: string | null }
}

export function ClassGroupsClient({
  currentUser,
  classGroups
}: {
  currentUser: { id: string; role: string }
  classGroups: GroupConversation[]
}) {
  const [selectedGroup, setSelectedGroup] = useState<GroupConversation | null>(
    classGroups.length === 1 ? classGroups[0] : null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load messages when group is selected
  useEffect(() => {
    if (!selectedGroup) return

    async function loadGroupMessages() {
      setLoading(true)
      setMessages([])
      try {
        const { data } = await supabase
          .from('messages')
          .select('*, sender:sender_id(full_name, salutation)')
          .eq('conversation_id', selectedGroup!.conversationId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (data) setMessages(data as any)

        // Count participants
        const { count } = await supabase
          .from('conversation_participants')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', selectedGroup!.conversationId)
        setParticipantCount(count || 0)

        // Mark read
        await supabase
          .from('conversation_participants')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', selectedGroup!.conversationId)
          .eq('user_id', currentUser.id)
      } catch (err) {
        console.error('Failed to load group messages', err)
      } finally {
        setLoading(false)
      }
    }
    loadGroupMessages()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup?.conversationId])

  // Realtime subscription for group messages
  useEffect(() => {
    if (!selectedGroup) return

    const channel = supabase
      .channel(`class_group:${selectedGroup.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedGroup.conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message
          if (newMsg.sender_id !== currentUser.id) {
            // Fetch sender info
            const { data: sender } = await supabase
              .from('users')
              .select('full_name, salutation')
              .eq('id', newMsg.sender_id)
              .single()
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev
              return [...prev, { ...newMsg, sender: sender || undefined }]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup?.conversationId, currentUser.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !selectedGroup) return

    setSending(true)
    const msgContent = input.trim()
    setInput('')

    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversation_id: selectedGroup.conversationId,
      sender_id: currentUser.id,
      content: msgContent,
      created_at: new Date().toISOString(),
      is_pending: true
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const sent = await sendMessage(selectedGroup.conversationId, msgContent)
      setMessages(prev => prev.map(m => m.id === tempId ? { ...sent, sender: undefined } : m))
    } catch (err) {
      console.error('Send error:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const getSenderName = (msg: Message) => {
    if (msg.sender_id === currentUser.id) return 'You'
    const s = (msg as any).sender
    if (!s) return 'Member'
    return s.salutation ? `${s.salutation} ${s.full_name}` : s.full_name
  }

  // GROUP LIST VIEW
  if (!selectedGroup) {
    return (
      <div className="flex h-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl"
           style={{ minHeight: '520px', maxHeight: 'calc(100vh - 200px)' }}>
        <div className="flex flex-col w-full p-4 gap-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Your Class Groups</p>
          {classGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-cyan-400/50 bg-white dark:bg-slate-900 hover:bg-blue-50/30 dark:hover:bg-cyan-900/10 transition-all group text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users2 className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{group.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Class group conversation</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // GROUP CHAT VIEW
  return (
    <div className="flex h-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl"
         style={{ minHeight: '520px', maxHeight: 'calc(100vh - 200px)' }}>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          {classGroups.length > 1 && (
            <button
              onClick={() => setSelectedGroup(null)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Users2 className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-sm truncate">{selectedGroup.title}</p>
            <p className="text-[11px] text-cyan-500 font-medium">{participantCount} members</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-muted-foreground">
              <Users2 className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium">No messages yet in this group</p>
              <p className="text-xs">Be the first to send a message!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUser.id
              const prevMsg = messages[idx - 1]
              const sameSender = prevMsg?.sender_id === msg.sender_id
              const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000)

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showTime && (
                    <span className="text-[10px] font-semibold text-slate-400 self-center my-2">
                      {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {!isMe && !sameSender && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 ml-1 mb-0.5">
                      {getSenderName(msg)}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm mb-1 ${
                    isMe
                      ? 'bg-[#1D6FEB] text-white rounded-br-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm border border-slate-200 dark:border-slate-700'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className="flex items-end justify-between gap-3 mt-1">
                      <span className={`text-[10px] font-medium ${isMe ? 'text-cyan-200' : 'text-slate-400'}`}>
                        {formatTime(msg.created_at)}
                      </span>
                      {isMe && (
                        <span className="shrink-0">
                          {(msg as any).is_pending ? (
                            <Check className="w-3.5 h-3.5 text-cyan-200/70" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message ${selectedGroup.title}…`}
              disabled={sending}
              className="flex-1 h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1D6FEB] text-white disabled:opacity-50 hover:bg-[#1558C8] transition-colors shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
