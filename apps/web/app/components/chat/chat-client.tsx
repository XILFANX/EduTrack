'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2, UserCircle2 } from 'lucide-react'

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

    const channel = supabase
      .channel(`chat:${selectedContact.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'communications' },
        (payload) => {
          const newMsg = payload.new as Message
          if (
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === selectedContact.id) ||
            (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === currentUser.id)
          ) {
            setMessages(prev => [...prev, newMsg])
            
            // Mark as read if receiving
            if (newMsg.receiver_id === currentUser.id) {
              supabase.from('communications').update({ is_read: true }).eq('id', newMsg.id)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedContact?.id, currentUser.id, supabase])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selectedContact) return

    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: selectedContact.id,
      message: input.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    }

    setMessages(prev => [...prev, tempMsg])
    const msgText = input.trim()
    setInput('')

    await supabase.from('communications').insert({
      landlord_id: landlordId,
      sender_id: currentUser.id,
      receiver_id: selectedContact.id,
      message: msgText
    })
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] min-h-[500px] bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Contacts Sidebar */}
      <div className="w-1/3 border-r border-border bg-muted/10 flex flex-col">
        <div className="p-4 border-b border-border bg-muted/30">
          <h2 className="font-semibold text-foreground">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedContact(c)}
              className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-border/50 last:border-0 ${
                selectedContact?.id === c.id ? 'bg-violet-50 dark:bg-violet-900/20' : 'hover:bg-muted/50'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {c.role} {c.unit ? `· Unit ${c.unit}` : ''}
                </p>
              </div>
            </button>
          ))}
          {contacts.length === 0 && (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No contacts available
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedContact ? (
          <>
            <div className="p-4 border-b border-border bg-white/50 dark:bg-slate-950/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{selectedContact.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{selectedContact.role}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm text-center flex-col gap-2">
                  <p className="text-4xl">👋</p>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map(m => {
                  const isMe = m.sender_id === currentUser.id
                  return (
                    <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMe 
                          ? 'bg-violet-600 text-white rounded-br-sm' 
                          : 'bg-muted border border-border text-foreground rounded-bl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-violet-200' : 'text-muted-foreground'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-h-[44px] max-h-[120px]"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(e)
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground flex-col gap-3">
            <p className="text-4xl">💬</p>
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}
