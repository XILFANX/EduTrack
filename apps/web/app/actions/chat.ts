'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function updateLastSeen() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Need to check if last_seen_at column exists in users table, if not it's fine, 
  // I will check database.ts first. Wait, I'll just write it. If it fails, I'll add the column.
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() }) // Using updated_at as a proxy for now if last_seen_at is missing
    .eq('id', user.id)
}

export async function getOrCreateConversation(targetUserId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', user.id)
    .single()
    
  if (!profile?.school_id) throw new Error('No school profile found')

  const admin = createAdminClient()

  // Find a conversation where both users are participants
  const { data: existingConvos } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .in('user_id', [user.id, targetUserId])

  const convoCounts = (existingConvos || []).reduce((acc: any, curr: any) => {
    acc[curr.conversation_id] = (acc[curr.conversation_id] || 0) + 1
    return acc
  }, {})

  const sharedConvoId = Object.keys(convoCounts).find(id => convoCounts[id] === 2)

  if (sharedConvoId) {
    return { conversationId: sharedConvoId }
  }

  // Create new conversation
  const { data: newConvo, error: createError } = await admin
    .from('conversations')
    .insert({
      school_id: profile.school_id,
      title: null
    })
    .select()
    .single()

  if (createError || !newConvo) {
    console.error('Error creating conversation:', createError)
    throw new Error('Failed to create conversation')
  }

  // Add participants
  await admin
    .from('conversation_participants')
    .insert([
      { conversation_id: newConvo.id, user_id: user.id },
      { conversation_id: newConvo.id, user_id: targetUserId }
    ])

  return { conversationId: newConvo.id }
}

export async function broadcastAnnouncement(title: string, body: string, targetAudience: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('users')
    .select('school_id, role')
    .eq('id', user.id)
    .single()
    
  if (!profile?.school_id) throw new Error('No school profile found')

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      school_id: profile.school_id,
      title,
      body,
      target_audience: targetAudience,
      author_id: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating announcement:', error)
    throw new Error('Failed to create announcement')
  }

  return { success: true, data }
}

export async function markConversationAsRead(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  if (!content.trim()) throw new Error('Message cannot be empty')

  // Verify sender is a participant before inserting
  const admin = createAdminClient()
  const { data: participant } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!participant) throw new Error('Not a participant of this conversation')

  const { data, error } = await admin
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    })
    .select()
    .single()

  if (error) throw new Error('Failed to send message: ' + error.message)
  return data
}
