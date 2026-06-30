import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Megaphone } from 'lucide-react'
import { ChatWidget } from '@/components/shared/chat-widget'
import { redirect } from 'next/navigation'

export default async function ParentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileResult } = await supabase
    .from('users')
    .select('school_id, full_name')
    .eq('id', user.id)
    .single()

  const profile = profileResult as any
  if (!profile?.school_id) return null

  // Mock data for UI demonstration purposes
  const mockAnnouncements = [
    { id: '1', title: 'School Closed Tomorrow', body: 'Please be advised that the school will remain closed tomorrow due to heavy rains in the area.', date: 'Oct 24, 2026' },
  ]

  const mockMessages = [
    { id: '1', content: 'Hello, I wanted to ask about the upcoming field trip?', senderId: user.id, timestamp: new Date().toISOString() },
    { id: '2', content: 'Hi there! Yes, the field trip is scheduled for next Friday. Please remember to sign the permission slip.', senderId: 'teacher-1', timestamp: new Date().toISOString() },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Communicate with teachers and read school announcements.</p>
      </div>

      {/* Global Announcements Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-foreground">Announcements</h2>
        </div>
        <div className="space-y-3">
          {mockAnnouncements.map(ann => (
            <Card key={ann.id} className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground text-orange-900 dark:text-orange-200">{ann.title}</h3>
                  <span className="text-xs text-orange-600/70 font-medium">{ann.date}</span>
                </div>
                <p className="text-sm text-orange-800/80 dark:text-orange-200/80">{ann.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Direct Messages Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-foreground">Direct Messages</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            {/* Contact List Mock */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 cursor-pointer">
              <h4 className="font-semibold text-foreground text-sm">Class Teacher (Grade 4)</h4>
              <p className="text-xs text-muted-foreground truncate">Hi there! Yes, the field trip is...</p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-foreground text-sm">Principal's Office</h4>
              <p className="text-xs text-muted-foreground truncate">Thank you for your feedback.</p>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <ChatWidget 
              currentUserId={user.id} 
              recipientName="Class Teacher (Grade 4)" 
              initialMessages={mockMessages} 
            />
          </div>
        </div>
      </section>
    </div>
  )
}
