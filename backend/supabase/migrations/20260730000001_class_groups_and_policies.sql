-- M3: Automated Class Groups + M4: Policy-Driven Communication
-- Migration: 20260730000001_class_groups_and_policies.sql

-- ============================================================
-- M3: Class Group Conversations
-- ============================================================

-- Add group_type and class_id to conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS group_type text DEFAULT 'direct' CHECK (group_type IN ('direct', 'class_group')),
  ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE;

-- Ensure each class only has one group conversation per school
CREATE UNIQUE INDEX IF NOT EXISTS conversations_class_id_unique
  ON public.conversations (class_id)
  WHERE class_id IS NOT NULL;

-- Function to get or create a class group conversation and return its id
CREATE OR REPLACE FUNCTION public.get_or_create_class_group(p_class_id uuid, p_school_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_convo_id uuid;
  v_class_name text;
BEGIN
  -- Try to find existing class group conversation
  SELECT id INTO v_convo_id
  FROM public.conversations
  WHERE class_id = p_class_id AND group_type = 'class_group';

  IF v_convo_id IS NOT NULL THEN
    RETURN v_convo_id;
  END IF;

  -- Get class name for conversation title
  SELECT name INTO v_class_name FROM public.classes WHERE id = p_class_id;

  -- Create group conversation
  INSERT INTO public.conversations (school_id, title, group_type, class_id)
  VALUES (p_school_id, v_class_name || ' Group', 'class_group', p_class_id)
  RETURNING id INTO v_convo_id;

  -- Add class teacher as participant
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  SELECT v_convo_id, class_teacher_id
  FROM public.classes
  WHERE id = p_class_id AND class_teacher_id IS NOT NULL
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_convo_id;
END;
$$;

-- Trigger function: when a student_parent link is created, auto-add parent to class group
CREATE OR REPLACE FUNCTION public.auto_enroll_parent_in_class_group()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_class_id uuid;
  v_school_id uuid;
  v_convo_id uuid;
BEGIN
  -- Get the student's class and school
  SELECT class_id, school_id INTO v_class_id, v_school_id
  FROM public.students
  WHERE id = NEW.student_id;

  IF v_class_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get or create class group conversation
  v_convo_id := public.get_or_create_class_group(v_class_id, v_school_id);

  -- Add parent as participant
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (v_convo_id, NEW.parent_id)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger: fires when a parent-student link is inserted
DROP TRIGGER IF EXISTS trg_auto_enroll_parent ON public.student_parents;
CREATE TRIGGER trg_auto_enroll_parent
  AFTER INSERT ON public.student_parents
  FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_parent_in_class_group();

-- Trigger function: when class_teacher_id changes, update group conversation participants
CREATE OR REPLACE FUNCTION public.auto_update_class_teacher_in_group()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_convo_id uuid;
BEGIN
  -- Find the class group conversation if it exists
  SELECT id INTO v_convo_id
  FROM public.conversations
  WHERE class_id = NEW.id AND group_type = 'class_group';

  IF v_convo_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Remove old teacher if they changed
  IF OLD.class_teacher_id IS NOT NULL AND OLD.class_teacher_id != NEW.class_teacher_id THEN
    DELETE FROM public.conversation_participants
    WHERE conversation_id = v_convo_id AND user_id = OLD.class_teacher_id;
  END IF;

  -- Add new teacher
  IF NEW.class_teacher_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_convo_id, NEW.class_teacher_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_update_class_teacher ON public.classes;
CREATE TRIGGER trg_auto_update_class_teacher
  AFTER UPDATE OF class_teacher_id ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.auto_update_class_teacher_in_group();

-- ============================================================
-- M4: Policy-Driven Communication (per-school admin toggles)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messaging_policies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL UNIQUE,
  -- Can parents message class teachers directly?
  parents_can_message_teachers boolean DEFAULT true,
  -- Can parents message school admin/principal directly?
  parents_can_message_admin boolean DEFAULT true,
  -- Can parents message other parents in the same class?
  parents_can_message_parents boolean DEFAULT false,
  -- Can subject teachers message parents?
  subject_teachers_can_message_parents boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.messaging_policies ENABLE ROW LEVEL SECURITY;

-- Only principals/admins can manage policies
CREATE POLICY "Admins can manage messaging policies"
  ON public.messaging_policies FOR ALL
  USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'principal', 'headteacher'))
  )
  WITH CHECK (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'principal', 'headteacher'))
  );

-- All school users can read their school's policies (so client can enforce them)
CREATE POLICY "School users can read messaging policies"
  ON public.messaging_policies FOR SELECT
  USING (
    school_id IN (SELECT school_id FROM public.users WHERE id = auth.uid())
  );
