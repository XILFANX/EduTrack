'use client'

import { useState } from 'react'
import { MessageSquare, Megaphone, ChevronRight, Users2 } from 'lucide-react'
import { ChatClient } from '@/components/shared/chat-client'
import { AnnouncementsClient } from '@/components/shared/announcements-client'
import { AnnouncementsFeed, Announcement } from '@/components/shared/announcements-feed'
import { ClassGroupsClient } from '@/components/shared/class-groups-client'

import type { DirectoryCategory } from '@/components/shared/chat-client'

interface Props {
  currentUser: { id: string; role: string }
  contacts: any[]
  classes: any[]
  classGroups?: { id: string; title: string; conversationId: string }[]
  initialContactId?: string
  announcements: Announcement[]
  audienceOptions: { value: string; label: string }[]
  subjectPlaceholder?: string
  directoryCategories: DirectoryCategory[]
}

type Tab = 'messages' | 'groups' | 'broadcasts'

export function MessagesLayout({
  currentUser,
  contacts,
  classes,
  classGroups,
  initialContactId,
  announcements,
  audienceOptions,
  subjectPlaceholder,
  directoryCategories,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(
    initialContactId ? 'messages' : 'messages'
  )

  const tabs: { id: Tab; label: string; icon: React.ElementType; desc: string }[] = [
    { id: 'messages', label: 'Direct Messages', icon: MessageSquare, desc: 'Chat with staff & parents' },
    ...(classGroups && classGroups.length > 0 ? [{ id: 'groups' as Tab, label: 'Class Groups', icon: Users2, desc: 'Class group conversations' }] : []),
    { id: 'broadcasts', label: 'Broadcasts', icon: Megaphone, desc: 'Send school-wide announcements' },
  ]

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto pb-24">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Communications Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage direct messages and school-wide broadcasts from one place.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 w-full md:w-fit mb-6 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-[#1D6FEB] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
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
            directoryCategories={directoryCategories}
          />
        </div>
      )}

      {activeTab === 'groups' && classGroups && (
        <div className="flex-1">
          <ClassGroupsClient
            currentUser={currentUser}
            classGroups={classGroups}
          />
        </div>
      )}

      {activeTab === 'broadcasts' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Compose */}
          {audienceOptions.length > 0 && (
            <div className="xl:col-span-2 space-y-4">
              <section className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground text-sm">New Broadcast</h2>
                    <p className="text-[10px] text-muted-foreground">Send to targeted audience</p>
                  </div>
                </div>
                <div className="p-5">
                  <AnnouncementsClient audienceOptions={audienceOptions} subjectPlaceholder={subjectPlaceholder} />
                </div>
              </section>
            </div>
          )}

          {/* Feed */}
          <div className={audienceOptions.length > 0 ? "xl:col-span-3 space-y-4" : "xl:col-span-5 space-y-4 max-w-3xl mx-auto"}>
            <div className="flex items-center justify-between px-1">
              <h3 className="font-semibold text-foreground text-sm uppercase tracking-widest">Recent Broadcasts</h3>
              <span className="text-xs text-muted-foreground">{announcements.length} total</span>
            </div>
            <div className="max-h-[700px] overflow-y-auto space-y-3 pr-1">
              <AnnouncementsFeed announcements={announcements} currentUserId={currentUser.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
