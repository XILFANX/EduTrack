'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, UserCircle2, Check, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'

interface Contact {
  id: string
  name: string
  role: string
  unit?: string
}

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
  is_read: boolean
}

export function ChatClient({ 
  currentUser, 
  contacts, 
  landlordId 
}: { 
  currentUser: { id: string, role: string }, 
  contacts: Contact[], 
  landlordId: string 
}) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Track the selected contact safely for the realtime listener
  const selectedContactIdRef = useRef<string | null>(null)
  useEffect(() => {
    selectedContactIdRef.current = selectedContact?.id || null
  }, [selectedContact])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedContact) return

    async function loadMessages() {
      setLoading(true)
      const { data } = await supabase
        .from('communications')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContact?.id}),and(sender_id.eq.${selectedContact?.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setMessages(data)
        // Mark as read
        const unreadIds = data.filter(m => m.receiver_id === currentUser.id && !m.is_read).map(m => m.id)
        if (unreadIds.length > 0) {
          await supabase.from('communications').update({ is_read: true }).in('id', unreadIds)
        }
      }
      setLoading(false)
    }

    loadMessages()
  }, [selectedContact?.id, currentUser.id, supabase])

  // Global realtime listener for the current user
  useEffect(() => {
    const channel = supabase
      .channel(`chat:global:${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => {
          const newMsg = payload.new as Message
          
          // Is it related to the CURRENTLY selected contact?
          const currentSelected = selectedContactIdRef.current
          if (
            currentSelected &&
            ((newMsg.sender_id === currentUser.id && newMsg.receiver_id === currentSelected) ||
             (newMsg.sender_id === currentSelected && newMsg.receiver_id === currentUser.id))
          ) {
            setMessages(prev => {
              const existingIndex = prev.findIndex(m => m.id === newMsg.id)
              if (existingIndex > -1) {
                const updated = [...prev]
                updated[existingIndex] = newMsg
                return updated
              }
              return [...prev, newMsg]
            })
            
            // Mark as read if we are receiving it in the active window
            if (newMsg.receiver_id === currentUser.id) {
              supabase.from('communications').update({ is_read: true }).eq('id', newMsg.id)
            }
          } 
          // If it's a message for us, but from someone else (or we don't have a chat open)
          else if (newMsg.receiver_id === currentUser.id) {
            const sender = contacts.find(c => c.id === newMsg.sender_id)
            toast(`New message from ${sender?.name || 'someone'}`, {
              description: newMsg.message.length > 50 ? newMsg.message.substring(0, 50) + '...' : newMsg.message,
              action: {
                label: 'View',
                onClick: () => {
                  if (sender) setSelectedContact(sender)
                }
              }
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'communications' },
        (payload) => {
          const updatedMsg = payload.new as Message
          setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === updatedMsg.id)
            if (existingIndex > -1) {
              const updated = [...prev]
              updated[existingIndex] = updatedMsg
              return updated
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser.id, supabase, contacts])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selectedContact) return

    const msgId = crypto.randomUUID()
    const msgText = input.trim()
    
    const tempMsg: Message = {
      id: msgId,
      sender_id: currentUser.id,
      receiver_id: selectedContact.id,
      message: msgText,
      created_at: new Date().toISOString(),
      is_read: false
    }

    setMessages(prev => [...prev, tempMsg])
    setInput('')

    await supabase.from('communications').insert({
      id: msgId,
      landlord_id: landlordId,
      sender_id: currentUser.id,
      receiver_id: selectedContact.id,
      message: msgText
    })
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[500px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Contacts Sidebar */}
      <div className="w-1/3 border-r border-border bg-background flex flex-col">
        <div className="p-4 bg-muted/30 border-b border-border flex items-center h-[72px]">
          <h2 className="font-bold text-lg text-foreground tracking-tight">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => {
            const isSelected = selectedContact?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => setSelectedContact(c)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-all border-b border-border/50 last:border-0 ${
                  isSelected ? 'bg-muted/80' : 'hover:bg-muted/40'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0 shadow-sm">
                  <UserCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-semibold text-foreground truncate">{c.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {c.role} {c.unit ? `· Unit ${c.unit}` : ''}
                  </p>
                </div>
              </button>
            )
          })}
          {contacts.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No contacts available
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[#efeae2] dark:bg-[#0b141a]">
        {/* Subtle Background Pattern (WhatsApp style) */}
        <div className="absolute inset-0 opacity-40 dark:opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 bg-white dark:bg-[#202c33] border-b border-border flex items-center gap-3 relative z-10 shadow-sm h-[72px]">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-[15px] leading-tight">{selectedContact.name}</h3>
                <p className="text-[13px] text-muted-foreground capitalize leading-tight mt-0.5">{selectedContact.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="bg-white/80 dark:bg-[#111b21]/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm">
                    <p className="text-xs text-muted-foreground">Send a message to start the conversation.</p>
                  </div>
                </div>
              ) : (
                messages.map(m => {
                  const isMe = m.sender_id === currentUser.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`relative max-w-[85%] sm:max-w-[75%] px-3 py-1.5 shadow-sm ${
                        isMe 
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-sm' 
                          : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-xl rounded-tr-xl rounded-br-xl rounded-bl-sm'
                      }`}>
                        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap pb-3 pr-2">{m.message}</p>
                        <div className="absolute bottom-1 right-2 flex items-center gap-1">
                          <span className="text-[10px] text-black/40 dark:text-white/40">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span className={m.is_read ? 'text-blue-500' : 'text-black/30 dark:text-white/30'}>
                              {m.is_read ? <CheckCheck className="w-[14px] h-[14px]" /> : <Check className="w-[14px] h-[14px]" />}
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

            {/* Input Area */}
            <div className="p-3 bg-[#f0f2f5] dark:bg-[#202c33] relative z-10">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl overflow-hidden shadow-sm">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message"
                    className="w-full bg-transparent border-0 px-4 py-3 text-[15px] resize-none focus:outline-none focus:ring-0 min-h-[44px] max-h-[120px] text-foreground placeholder:text-muted-foreground"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage(e)
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-12 h-12 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm"
                >
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center relative z-10">
            <div className="w-64 h-64 opacity-50 mb-6 bg-slate-200 dark:bg-[#202c33] rounded-full flex items-center justify-center">
              <p className="text-6xl">💬</p>
            </div>
            <h2 className="text-xl font-light text-foreground mb-2">EstateTrack Web</h2>
            <p className="text-sm text-muted-foreground max-w-sm text-center">
              Select a chat from the sidebar to view your conversation.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

