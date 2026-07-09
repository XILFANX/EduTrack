import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Megaphone, Plus } from 'lucide-react'
import { ChatWidget } from '@/components/shared/chat-widget'
import { redirect } from 'next/navigation'

export default async function PrincipalMessagesPage() {
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

  // Mock data for UI demonstration purposes instead of complex joins for MVP
  const mockAnnouncements = [
    { id: '1', title: 'School Closed Tomorrow', audience: 'All', date: 'Oct 24, 2026' },
    { id: '2', title: 'PTA Meeting Scheduled', audience: 'Parents', date: 'Oct 20, 2026' }
  ]

  const mockMessages = [
    { id: '1', content: 'Good morning Principal, regarding the new timetable...', senderId: 'teacher-1', timestamp: new Date().toISOString() },
    { id: '2', content: 'Yes, I received your email. We will discuss it at 10.', senderId: user.id, timestamp: new Date().toISOString() },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Communications</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage announcements and direct messages.</p>
      </div>

      {/* Global Announcements Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Megaphone className="w-5 h-5 text-orange-500" />
            Global Announcements
          </h2>
          <Button variant="outline" className="gap-2 text-slate-600 dark:text-slate-300">
            <Plus className="w-4 h-4" />
            New Broadcast
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockAnnouncements.map(ann => (
            <Card key={ann.id} className="border-slate-200 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/10">
              <CardContent className="p-4">
                <h3 className="font-bold text-foreground mb-1">{ann.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>To: <span className="font-medium text-foreground">{ann.audience}</span></span>
                  <span>{ann.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Direct Messages Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-foreground">Direct Messages</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            {/* Contact List Mock */}
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 cursor-pointer">
              <h4 className="font-semibold text-foreground text-sm">Mr. John Doe</h4>
              <p className="text-xs text-muted-foreground truncate">Yes, I received your email. We will...</p>
            </div>
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-foreground text-sm">Mrs. Smith (Parent)</h4>
              <p className="text-xs text-muted-foreground truncate">Can you confirm if the bus route...</p>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <ChatWidget 
              currentUserId={user.id} 
              recipientName="Mr. John Doe" 
              initialMessages={mockMessages} 
            />
          </div>
        </div>
      </section>
    </div>
  )
}
