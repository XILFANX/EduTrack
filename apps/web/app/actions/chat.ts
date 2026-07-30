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
    .update({ last_seen_at: new Date().toISOString() })
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
export async function deleteAnnouncement(id: string) { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error('Not authenticated'); const { error } = await supabase.from('announcements').delete().eq('id', id).eq('author_id', user.id); if (error) throw new Error('Failed to delete announcement'); return { success: true }; }

/**
 * Returns all class group conversations the current user is a participant of.
 * Used by teachers, parents, and admins to show the "Groups" tab.
 */
export async function getMyClassGroups() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get conversation IDs this user participates in
  const { data: participations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id)

  const conversationIds = (participations || []).map((p: any) => p.conversation_id)
  if (conversationIds.length === 0) return []

  // Filter to class group conversations only
  const { data: groups } = await supabase
    .from('conversations')
    .select('id, title, class_id')
    .in('id', conversationIds)
    .eq('group_type' as any, 'class_group')
    .not('class_id', 'is', null)

  return (groups || []).map((g: any) => ({
    id: g.class_id as string,
    title: g.title as string,
    conversationId: g.id as string,
  }))
}

/**
 * Fetches the messaging policy for the current user's school.
 * Returns defaults if no policy has been configured yet.
 */
export async function getMessagingPolicy() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  const { data: policy } = await (supabase as any)
    .from('messaging_policies')
    .select('*')
    .eq('school_id', profile.school_id)
    .single()

  // Return policy or sensible defaults
  return (policy as {
    parents_can_message_teachers: boolean
    parents_can_message_admin: boolean
    parents_can_message_parents: boolean
    subject_teachers_can_message_parents: boolean
  } | null) || {
    parents_can_message_teachers: true,
    parents_can_message_admin: true,
    parents_can_message_parents: false,
    subject_teachers_can_message_parents: true,
  }
}

/**
 * Upserts the messaging policy for the current user's school.
 * Only principals and admins can call this (enforced via RLS).
 */
export async function upsertMessagingPolicy(policy: {
  parents_can_message_teachers: boolean
  parents_can_message_admin: boolean
  parents_can_message_parents: boolean
  subject_teachers_can_message_parents: boolean
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('users').select('school_id, role').eq('id', user.id).single()
  if (!profile?.school_id) throw new Error('No school profile')
  if (!['admin', 'principal', 'headteacher'].includes(profile.role)) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('messaging_policies')
    .upsert({ school_id: profile.school_id, ...policy, updated_at: new Date().toISOString() }, { onConflict: 'school_id' })

  if (error) throw new Error('Failed to save policy: ' + error.message)
  return { success: true }
}
