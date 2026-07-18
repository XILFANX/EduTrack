-- ============================================================
-- Fix messaging RLS policies so users can send/receive messages
-- in conversations they participate in
-- ============================================================

-- 1. Conversations: users can view conversations they are in
DO $$ BEGIN
  CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT
    USING (
      id IN (
        SELECT conversation_id FROM public.conversation_participants
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Conversation participants
DO $$ BEGIN
  CREATE POLICY "Users can view their participations"
    ON public.conversation_participants FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert participations"
    ON public.conversation_participants FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own participation"
    ON public.conversation_participants FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Messages: users can send/receive in conversations they participate in
DO $$ BEGIN
  CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (
      conversation_id IN (
        SELECT conversation_id FROM public.conversation_participants
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can send messages in their conversations"
    ON public.messages FOR INSERT
    WITH CHECK (
      sender_id = auth.uid()
      AND conversation_id IN (
        SELECT conversation_id FROM public.conversation_participants
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Announcements: all school users can INSERT (for class teachers broadcasting)
-- Drop overly restrictive policies if any exist
DO $$ BEGIN
  CREATE POLICY "Staff can create announcements"
    ON public.announcements FOR INSERT
    WITH CHECK (
      author_id = auth.uid()
      AND school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can view announcements for their school"
    ON public.announcements FOR SELECT
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Discipline logs: teachers can insert logs they record
DO $$ BEGIN
  CREATE POLICY "Teachers can insert discipline logs"
    ON public.discipline_logs FOR INSERT
    WITH CHECK (recorded_by = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Teachers can view discipline logs for their school"
    ON public.discipline_logs FOR SELECT
    USING (
      school_id IN (
        SELECT school_id FROM public.users WHERE id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
