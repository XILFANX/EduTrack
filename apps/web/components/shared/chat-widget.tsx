'use client'

import { useState } from 'react'
import { Send, User } from 'lucide-react'

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
}

interface ChatWidgetProps {
  currentUserId: string
  recipientName: string
  initialMessages?: Message[]
  onSendMessage?: (content: string) => Promise<void>
}

export function ChatWidget({ currentUserId, recipientName, initialMessages = [], onSendMessage }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const newMsg: Message = {
      id: Math.random().toString(36).substring(7),
      content: input.trim(),
      senderId: currentUserId,
      timestamp: new Date().toISOString(),
    }
    
    setMessages(prev => [...prev, newMsg])
    setInput('')
    
    if (onSendMessage) {
      setIsSending(true)
      await onSendMessage(newMsg.content)
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{recipientName}</h3>
          <p className="text-xs text-emerald-500 font-medium">Online</p>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUserId
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-foreground rounded-bl-sm'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full h-12 pl-4 pr-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-foreground"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
