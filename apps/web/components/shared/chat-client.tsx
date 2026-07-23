'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Send, UserCircle2, Loader2, ArrowLeft, Users, Briefcase,
  GraduationCap, Shield, ChevronRight, Search, MessageSquare
} from 'lucide-react'
import { getOrCreateConversation, markConversationAsRead, sendMessage } from '@/app/actions/chat'

interface Contact {
  id: string
  name: string
  role: string
  subtitle?: string
  last_seen_at?: string | null
  roleOrder?: number
  classIds?: string[]
}

interface ClassItem {
  id: string
  name: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
}

// Admin-level roles that get masked to "School Admin"
const ADMIN_ROLE_VALUES = ['Admin', 'Principal', 'Headteacher', 'Platform Admin']

const CATEGORIES = [
  { id: 'teaching', label: 'Teaching Staff', icon: GraduationCap, roles: ['Class Teacher', 'Subject Teacher'] },
  { id: 'non_teaching', label: 'Non-Teaching Staff', icon: Briefcase, roles: ['Bursar', 'Librarian', 'Storekeeper', 'Transport Matron'] },
  { id: 'parents', label: 'Parents', icon: Users, roles: ['Parent'] },
  { id: 'admin', label: 'School Admin', icon: Shield, roles: ['Admin', 'Principal', 'Headteacher', 'Platform Admin'] },
]

function maskAdminContact(c: Contact): Contact {
  if (ADMIN_ROLE_VALUES.includes(c.role)) {
    return { ...c, name: 'School Admin', role: 'Administrator' }
  }
  return c
}

export function ChatClient({
  currentUser,
  contacts,
  classes,
  initialContactId
}: {
  currentUser: { id: string, role: string },
  contacts: Contact[],
  classes?: ClassItem[],
  initialContactId?: string
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const presenceChannelRef = useRef<any>(null)
  const supabase = createClient()

  // Determine which categories the current user should NOT see
  const currentUserRole = currentUser.role // e.g. 'admin', 'principal', 'headteacher'
  const isAdminUser = ['admin', 'principal', 'headteacher'].includes(currentUserRole)

  // Filter out contacts that are same person, and for admins — hide other admins
  const visibleContacts = contacts.filter(c => {
    if (c.id === currentUser.id) return false
    if (isAdminUser && ADMIN_ROLE_VALUES.includes(c.role)) return false
    return true
  })

  // Visible categories: admins don't see the admin category
  const visibleCategories = CATEGORIES.filter(cat => {
    if (cat.id === 'admin' && isAdminUser) return false
    return true
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize selected contact from URL prop
  useEffect(() => {
    if (initialContactId) {
      const contact = contacts.find(c => c.id === initialContactId)
      if (contact) handleSelectContact(maskAdminContact(contact))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialContactId])

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

  // Presence channel setup
  useEffect(() => {
    const channel = supabase.channel('chat_presence', {
      config: { presence: { key: currentUser.id } },
    })
    presenceChannelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const online = new Set<string>()
        Object.keys(state).forEach(key => online.add(key))
        setOnlineUsers(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [currentUser.id, supabase])

  // Load conversation & messages when contact is selected
  useEffect(() => {
    if (!selectedContact) return

    async function loadChat() {
      setLoading(true)
      setMessages([])
      setConversationId(null)
      try {
        const { conversationId: cid } = await getOrCreateConversation(selectedContact!.id)
        setConversationId(cid)

        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', cid)
          .order('created_at', { ascending: true })
          .limit(100)

        if (data) {
          setMessages(data)
          await markConversationAsRead(cid)
        }
      } catch (err) {
        console.error('Failed to load chat', err)
      } finally {
        setLoading(false)
      }
    }

    loadChat()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.id])

  // Realtime subscription
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

    return () => { supabase.removeChannel(channel) }
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

    try {
      const data = await sendMessage(conversationId, msgContent)
      setMessages(prev => prev.map(m => m.id === tempId ? data as Message : m))
    } catch (err) {
      console.error('Send error:', err)
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const handleBackToDirectory = () => {
    if (selectedClassId) {
      setSelectedClassId(null)
    } else {
      setSelectedCategory(null)
    }
    setSearchQuery('')
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
  }

  const activeCategory = visibleCategories.find(c => c.id === selectedCategory)
  const isParentCategory = activeCategory?.id === 'parents'

  const categoryContacts = activeCategory
    ? visibleContacts.filter(c => activeCategory.roles.includes(c.role)).map(maskAdminContact)
    : []

  const globalSearchResults = searchQuery.trim()
    ? visibleContacts
        .map(maskAdminContact)
        .filter(c =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : []

  // =========================================================================
  // LAYOUT: on mobile, show either Directory OR Chat. On desktop, show both.
  // =========================================================================

  const showSidebar = !selectedContact || typeof window !== 'undefined' && window.innerWidth >= 768
  const chatOpen = !!selectedContact

  return (
    <div className="flex h-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl"
         style={{ minHeight: '520px', maxHeight: 'calc(100vh - 200px)' }}>

      {/* ======================= LEFT SIDEBAR ======================= */}
      <div className={`${chatOpen ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 shrink-0`}>

        {/* Sidebar Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
          {selectedCategory ? (
            <>
              <button
                onClick={handleBackToDirectory}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm truncate">
                  {selectedClassId
                    ? classes?.find(c => c.id === selectedClassId)?.name
                    : activeCategory?.label}
                </p>
                <p className="text-[11px] text-blue-500 font-medium">
                  {selectedClassId
                    ? `${categoryContacts.filter(c => c.classIds?.includes(selectedClassId!)).length} parents`
                    : `${categoryContacts.length} contacts`}
                </p>
              </div>
            </>
          ) : (
            <h2 className="text-base font-bold text-foreground">Directory</h2>
          )}
        </div>

        {/* Global search bar (shown only when not in a category) */}
        {!selectedCategory && (
          <div className="px-4 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search all contacts..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Sidebar scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim() && !selectedCategory ? (
            // GLOBAL SEARCH RESULTS
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">
                {globalSearchResults.length} result{globalSearchResults.length !== 1 ? 's' : ''}
              </p>
              {globalSearchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2 py-6 text-center">No contacts found for "{searchQuery}"</p>
              ) : (
                globalSearchResults.map(contact => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    selected={selectedContact?.id === contact.id}
                    online={onlineUsers.has(contact.id)}
                    onClick={() => handleSelectContact(contact)}
                  />
                ))
              )}
            </div>
          ) : !selectedCategory ? (
            // CATEGORIES VIEW
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">Select Directory</p>
              {visibleCategories.map(category => {
                const count = visibleContacts.filter(c => category.roles.includes(c.role)).length
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white dark:hover:bg-slate-900/60 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <Icon className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-sm">{category.label}</p>
                        <p className="text-xs text-muted-foreground">{count} member{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          ) : isParentCategory && !selectedClassId ? (
            // PARENT CLASS-FIRST VIEW
            <div className="p-3 space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-2">Select Class</p>
              {(classes || []).map(cls => {
                const count = categoryContacts.filter(c => c.classIds?.includes(cls.id)).length
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white dark:hover:bg-slate-900/60 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                        <GraduationCap className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground text-sm">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{count} parent{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          ) : (
            // CONTACTS LIST
            <div className="flex flex-col h-full">
              <div className="px-4 pt-3 pb-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Filter contacts..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {(() => {
                  let viewContacts = categoryContacts
                  if (selectedClassId) {
                    viewContacts = viewContacts.filter(c => c.classIds?.includes(selectedClassId))
                  }
                  if (searchQuery.trim()) {
                    viewContacts = viewContacts.filter(c =>
                      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  }

                  if (viewContacts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Users className="w-8 h-8 mb-2 opacity-40" />
                        <p className="text-sm">No contacts found</p>
                      </div>
                    )
                  }

                  return viewContacts.map(contact => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      selected={selectedContact?.id === contact.id}
                      online={onlineUsers.has(contact.id)}
                      onClick={() => handleSelectContact(contact)}
                    />
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================= RIGHT PANE: CHAT ======================= */}
      <div className={`${chatOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white dark:bg-slate-950 relative overflow-hidden`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shrink-0 z-10">
              <button
                onClick={handleBackToContacts}
                className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <UserCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-foreground text-sm truncate">{selectedContact.name}</h3>
                <p className="text-xs font-medium">
                  {onlineUsers.has(selectedContact.id) ? (
                    <span className="text-emerald-500">● Online</span>
                  ) : (
                    <span className="text-slate-400">● Offline</span>
                  )}
                  <span className="text-slate-400 mx-1.5">·</span>
                  <span className="text-muted-foreground">{selectedContact.role}</span>
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 relative z-0">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 px-6">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">Start the conversation</h3>
                    <p className="text-muted-foreground text-sm">Say hello to {selectedContact.name}!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 flex flex-col justify-end min-h-full">
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser.id
                    const prevMsg = messages[idx - 1]
                    const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000)

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <span className="text-[10px] font-semibold text-slate-400 self-center bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full my-3">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] shadow-sm mb-1 ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-foreground rounded-bl-sm border border-slate-200 dark:border-slate-700'
                        }`}>
                          <p className="text-[14px] leading-relaxed break-words">{msg.content}</p>
                          <span className={`text-[10px] font-medium mt-0.5 block ${isMe ? 'text-blue-200/80 text-right' : 'text-slate-400'}`}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 backdrop-blur-md shrink-0 z-10">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending || !conversationId}
                  className="flex-1 h-12 px-5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || !conversationId}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 -ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          // Empty state — desktop only (sidebar is shown on mobile)
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <MessageSquare className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">EduTrack Messaging</h2>
              <p className="text-muted-foreground text-sm max-w-xs">Select a contact from the directory on the left to start a secure conversation.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Reusable contact row sub-component
function ContactRow({
  contact,
  selected,
  online,
  onClick,
}: {
  contact: Contact
  selected: boolean
  online: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left ${
        selected
          ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30'
          : 'border-transparent hover:bg-white dark:hover:bg-slate-900/60 hover:border-slate-200 dark:hover:border-slate-700'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
          selected
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
        }`}>
          <UserCircle2 className="w-6 h-6" />
        </div>
        {online && (
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${selected ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'}`}>
          {contact.name}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{contact.role}</p>
        {contact.subtitle && (
          <p className="text-[10px] text-slate-400 truncate">{contact.subtitle}</p>
        )}
      </div>
    </button>
  )
}
