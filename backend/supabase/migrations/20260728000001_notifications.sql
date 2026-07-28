-- EduTrack Migration: Global Notification System
-- Creates the notifications table with support for contextual action buttons,
-- RLS policies, and optional pg_cron cleanup for 3-month-old read notifications.
-- Migration: 20260728000001_notifications.sql

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  link text,
  action_label text,
  action_href text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast unread count per user
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx
  ON public.notifications (user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Server-side (service role) inserts bypass RLS — no insert policy needed for normal flow.
-- Enable realtime for notification popups
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ── Automated cleanup (requires pg_cron extension) ──────────────────────────
-- Uncomment after enabling pg_cron in Supabase dashboard:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('cleanup-edu-notifications', '0 0 * * *', $$
--   DELETE FROM public.notifications WHERE is_read = true AND created_at < NOW() - INTERVAL '3 months';
-- $$);
