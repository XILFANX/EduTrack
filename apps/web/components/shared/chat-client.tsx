'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, UserCircle2, Loader2, ArrowLeft, Users, Briefcase, GraduationCap, Shield, ChevronRight, Search } from 'lucide-react'
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

const CATEGORIES = [
  { id: 'teaching', label: 'Teaching Staff', icon: GraduationCap, roles: ['Class Teacher', 'Subject Teacher'] },
  { id: 'non_teaching', label: 'Non-Teaching Staff', icon: Briefcase, roles: ['Bursar', 'Librarian', 'Storekeeper', 'Transport Matron'] },
  { id: 'parents', label: 'Parents', icon: Users, roles: ['Parent'] },
  { id: 'admin', label: 'Admin & Principals', icon: Shield, roles: ['Admin', 'Principal', 'Headteacher', 'Platform Admin'] }
]

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize selected contact from URL prop
  useEffect(() => {
    if (initialContactId) {
      const contact = contacts.find(c => c.id === initialContactId)
      if (contact) {
        handleSelectContact(contact)
      }
    }
  }, [initialContactId, contacts])

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact)
  }

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

  // Format time helper
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleBackToCategories = () => {
    if (selectedClassId) {
      setSelectedClassId(null)
    } else {
      setSelectedCategory(null)
    }
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
  }

  const activeCategory = CATEGORIES.find(c => c.id === selectedCategory)
  const isParentCategory = activeCategory?.id === 'parents'
  
  const filteredContacts = activeCategory 
    ? contacts.filter(c => activeCategory.roles.includes(c.role))
    : []

  const globalSearchResults = searchQuery.trim() 
    ? contacts.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <div className="flex h-[700px] bg-[#121827] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* LEFT SIDEBAR (Hidden on mobile when contact is selected) */}
      <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-800 bg-[#0b0f19] shrink-0 transition-transform ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800 bg-[#121827]">
          {selectedCategory ? (
            <div className="flex items-center gap-3 w-full">
              <button onClick={handleBackToCategories} className="p-2 -ml-2 rounded-full hover:bg-[#1a2133] text-slate-400 hover:text-slate-200 transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-100 truncate">
                  {selectedClassId 
                    ? classes?.find(c => c.id === selectedClassId)?.name 
                    : activeCategory?.label}
                </h2>
                <p className="text-xs text-blue-400 font-medium">
                  {selectedClassId
                    ? `${filteredContacts.filter(c => c.classIds?.includes(selectedClassId)).length} parents`
                    : `${filteredContacts.length} contacts`}
                </p>
              </div>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-slate-100">Chats</h2>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {/* Global Search */}
          {!selectedCategory && (
            <div className="px-4 pt-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search all contacts..."
                  className="w-full bg-[#121827] border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim() && !selectedCategory ? (
              // GLOBAL SEARCH RESULTS
              <div className="p-4 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-3">Search Results</p>
                {globalSearchResults.length === 0 ? (
                  <p className="text-sm text-slate-500 px-2 py-4 text-center">No contacts found matching "{searchQuery}"</p>
                ) : (
                  globalSearchResults.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:bg-[#121827] hover:border-slate-800 transition-all"
                    >
                      <div className="relative shrink-0">
                        <UserCircle2 className="w-10 h-10 text-slate-500" />
                        {onlineUsers.has(contact.id) && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0b0f19] rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm text-slate-200 truncate">{contact.name}</p>
                        <p className="text-xs text-slate-500 truncate">{contact.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : !selectedCategory ? (
            // CATEGORIES VIEW
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-4">Select Directory</p>
              {CATEGORIES.map(category => {
                const count = contacts.filter(c => category.roles.includes(c.role)).length
                const Icon = category.icon
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#121827] transition-all group border border-transparent hover:border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-200">{category.label}</p>
                        <p className="text-xs text-slate-500">{count} member{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          ) : isParentCategory && !selectedClassId ? (
            // PARENTS DIRECTORY - CLASS FIRST
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-4">Select Class</p>
              {classes?.map(cls => {
                const count = filteredContacts.filter(c => c.classIds?.includes(cls.id)).length
                return (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-[#121827] transition-all group border border-transparent hover:border-slate-800"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 group-hover:bg-indigo-500/20 transition-colors border border-indigo-500/10">
                        <GraduationCap className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-200">{cls.name}</p>
                        <p className="text-xs text-slate-500">{count} parent{count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </button>
                )
              })}
            </div>
          ) : (
            // CONTACTS VIEW (For specific category or specific class)
            <div className="p-4 flex flex-col h-full">
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter contacts..."
                  className="w-full bg-[#121827] border border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {(() => {
                  let viewContacts = filteredContacts
                  if (selectedClassId) {
                    viewContacts = viewContacts.filter(c => c.classIds?.includes(selectedClassId))
                  }
                  if (searchQuery.trim()) {
                    viewContacts = viewContacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  }
                  
                  if (viewContacts.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                        <Users className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No contacts found</p>
                      </div>
                    )
                  }

                  return viewContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border text-left ${
                        selectedContact?.id === contact.id
                          ? 'bg-[#1a2133] border-slate-700 shadow-sm'
                          : 'border-transparent hover:bg-[#121827] hover:border-slate-800'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <UserCircle2 className={`w-11 h-11 ${selectedContact?.id === contact.id ? 'text-blue-400' : 'text-slate-500'}`} />
                        {onlineUsers.has(contact.id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#0b0f19] rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className={`font-semibold text-sm truncate ${selectedContact?.id === contact.id ? 'text-blue-100' : 'text-slate-200'}`}>
                            {contact.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {contact.role}
                        </p>
                        {contact.subtitle && (
                          <p className="text-[10px] text-slate-600 truncate mt-0.5">
                            {contact.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* RIGHT PANE: Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#121827] relative ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="h-20 px-6 border-b border-slate-800 flex items-center gap-4 bg-[#121827]/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
              <button onClick={handleBackToContacts} className="md:hidden p-2 -ml-2 rounded-full hover:bg-[#1a2133] text-slate-400 hover:text-slate-200 transition-colors shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <UserCircle2 className="w-12 h-12 text-slate-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-100 text-lg truncate">{selectedContact.name}</h3>
                <p className="text-xs font-medium">
                  {onlineUsers.has(selectedContact.id) ? (
                    <span className="text-emerald-400">Online</span>
                  ) : (
                    <span className="text-slate-500">Offline</span>
                  )}
                  <span className="text-slate-600 mx-1.5">•</span>
                  <span className="text-slate-500 truncate">{selectedContact.role}</span>
                </p>
              </div>
            </div>

            {/* Messages Background with subtle pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-0">
              {loading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="text-slate-500 font-medium animate-pulse">Loading secure chat...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <UserCircle2 className="w-10 h-10 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-300 mb-2">Start a conversation</h3>
                    <p className="text-sm">End-to-end encrypted messaging with {selectedContact.name}. Say hello!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 flex flex-col justify-end min-h-full">
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === currentUser.id
                    const prevMsg = messages[idx - 1]
                    const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000)

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 mt-4 self-center bg-[#0b0f19] px-3 py-1 rounded-full border border-slate-800">
                            {new Date(msg.created_at).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 flex flex-col gap-1 shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-[#1a2133] border border-slate-700 text-slate-200 rounded-bl-sm'
                        }`}>
                          <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                          <span className={`text-[10px] self-end font-medium mt-1 ${isMe ? 'text-blue-200/80' : 'text-slate-500'}`}>
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

            {/* Input Area */}
            <div className="p-4 bg-[#121827] border-t border-slate-800 relative z-10 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending || !conversationId}
                  className="w-full h-14 pl-6 pr-16 rounded-full border border-slate-700 bg-[#0b0f19] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-[15px] text-slate-200 placeholder:text-slate-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending || !conversationId}
                  className="absolute right-2 w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 -ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-24 h-24 rounded-full bg-slate-800/30 flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-slate-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-300 mb-2">EduTrack Secure Messaging</h2>
            <p className="text-slate-500 max-w-sm text-center">Select a contact directory from the left menu to start a conversation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
