'use client'

import { useState } from 'react'
import { MessageSquare, Megaphone, ChevronRight } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsClient } from '@/components/shared/announcements-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'

interface Props {
  currentUser: { id: string; role: string }
  contacts: any[]
  classes: any[]
  initialContactId?: string
  announcements: Announcement[]
  audienceOptions: { value: string; label: string }[]
}

type Tab = 'messages' | 'broadcasts'

export function MessagesPageClient({
  currentUser,
  contacts,
  classes,
  initialContactId,
  announcements,
  audienceOptions,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(
    initialContactId ? 'messages' : 'messages'
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, desc: 'Chat with staff & parents' },
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone, desc: 'Send school-wide announcements' },
  ]

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Communications Hub</h1>
        <p className="text-sm text-slate-400 mt-1">Manage direct messages and school-wide broadcasts from one place.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#0b0f19] border border-slate-800 rounded-2xl p-1 w-fit mb-6 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#121827]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'messages' && (
        <div className="flex-1">
          <ChatClient
            currentUser={currentUser}
            contacts={contacts}
            classes={classes}
            initialContactId={initialContactId}
          />
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Compose */}
          <div className="xl:col-span-2 space-y-4">
            <section className="bg-[#121827] border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 bg-[#0b0f19] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Megaphone className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-100 text-sm">New Broadcast</h2>
                  <p className="text-[10px] text-slate-500">Send to targeted audience</p>
                </div>
              </div>
              <div className="p-5">
                <AnnouncementsClient audienceOptions={audienceOptions} />
              </div>
            </section>
          </div>

          {/* Feed */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-slate-300 text-sm uppercase tracking-widest">Recent Broadcasts</h3>
              <span className="text-xs text-slate-500">{announcements.length} total</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto space-y-3 pr-1">
              <AnnouncementsFeed announcements={announcements} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
