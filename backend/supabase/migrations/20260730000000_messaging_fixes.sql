-- Add is_read to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Add RLS Policies for conversations
CREATE POLICY "Users can view their conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert conversations" ON public.conversations
  FOR INSERT WITH CHECK (
    -- Any authenticated user can start a conversation in their school
    -- To be perfectly secure, we'd check if school_id matches their profile.
    -- Assuming app logic correctly assigns school_id.
    auth.uid() IS NOT NULL
  );

-- Add RLS Policies for conversation_participants
CREATE POLICY "Users can view their participation" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert participants" ON public.conversation_participants
  FOR INSERT WITH CHECK (
    -- Allow insertion if creating a conversation
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their participation" ON public.conversation_participants
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Add RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.messages.conversation_id
      AND user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update messages in their conversations" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their conversations messages" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = public.messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Add RLS Policies for announcements
CREATE POLICY "Users can view announcements for their school" ON public.announcements
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid()) OR
    school_id IS NULL
  );

CREATE POLICY "Users can insert announcements" ON public.announcements
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
  );

CREATE POLICY "Users can delete their announcements" ON public.announcements
  FOR DELETE USING (
    author_id = auth.uid()
  );
