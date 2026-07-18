'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, UserCircle2, Check, CheckCheck, Loader2 } from 'lucide-react'
import { getOrCreateConversation, markConversationAsRead } from '@/app/actions/chat'

interface Contact {
  id: string
  name: string
  role: string
  last_seen_at?: string | null
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

export function ChatClient({ 
  currentUser, 
  contacts, 
}: { 
  currentUser: { id: string, role: string }, 
  contacts: Contact[], 
}) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const presenceChannelRef = useRef<any>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Presence channel setup
  useEffect(() => {
    const channel = supabase.channel('chat_presence', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })
    presenceChannelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online = new Set<string>()
        Object.keys(state).forEach((key) => online.add(key))
        setOnlineUsers(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, supabase])

  // Load conversation & messages when contact is selected
  useEffect(() => {
    if (!selectedContact) return

    async function loadChat() {
      setLoading(true)
      try {
        const { conversationId } = await getOrCreateConversation(selectedContact!.id)
        setConversationId(conversationId)

        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(100)

        if (data) {
          setMessages(data)
          await markConversationAsRead(conversationId)
        }
      } catch (err) {
        console.error('Failed to load chat', err)
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  }, [selectedContact?.id, currentUser.id, supabase])

  // Realtime messages subscription for the active conversation
  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat:convo:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          if (newMsg.sender_id !== currentUser.id) {
            markConversationAsRead(conversationId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUser.id, supabase])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !conversationId || sending) return

    setSending(true)
    const msgContent = input.trim()
    setInput('')

    const tempId = `temp-${Date.now()}`
    const newMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: msgContent,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, newMsg])

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: msgContent
      })
      .select()
      .single()

    if (error) {
      console.error('Send error:', error)
      setMessages(prev => prev.filter(m => m.id !== tempId)) // Revert on error
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m))
    }

    setSending(false)
  }

  // Format time helper
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col md:flex-row h-[650px] bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
      
      {/* Contacts List */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-slate-50/50 dark:bg-slate-950/20 flex flex-col">
        <div className="p-4 border-b border-border bg-card">
          <h2 className="font-semibold text-foreground">Contacts</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.length === 0 ? (
            <div className="text-center p-4 text-sm text-muted-foreground">No contacts available.</div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  selectedContact?.id === contact.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-foreground'
                }`}
              >
                <div className="relative">
                  <UserCircle2 className={`w-10 h-10 ${selectedContact?.id === contact.id ? 'text-white/80' : 'text-slate-400'}`} />
                  {onlineUsers.has(contact.id) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{contact.name}</p>
                  <p className={`text-xs truncate ${selectedContact?.id === contact.id ? 'text-blue-200' : 'text-muted-foreground'}`}>
                    {contact.role}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-card">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-slate-50 dark:bg-slate-950">
              <UserCircle2 className="w-10 h-10 text-slate-400" />
              <div>
                <h3 className="font-semibold text-foreground">{selectedContact.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {onlineUsers.has(selectedContact.id) ? (
                    <span className="text-emerald-500 font-medium">Online</span>
                  ) : 'Offline'}
                </p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === currentUser.id
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 flex flex-col gap-1 ${
                        isMe 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white dark:bg-slate-900 border border-border text-foreground rounded-bl-sm shadow-sm'
                      }`}>
                        <p className="text-sm break-words">{msg.content}</p>
                        <span className={`text-[10px] self-end ${isMe ? 'text-blue-200' : 'text-muted-foreground'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border bg-card">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending || !conversationId}
                  className="w-full h-12 pl-4 pr-12 rounded-full border border-border bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || !conversationId}
                  className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-950/50">
            <p>Select a contact to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
