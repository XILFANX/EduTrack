-- EduTrack Migration: Messaging Enhancement
-- Adds is_read tracking to messages for unread badge and read-receipt support.
-- Migration: 20260728000000_messaging_enhancement.sql

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Index for fast unread count queries
CREATE INDEX IF NOT EXISTS messages_receiver_is_read_idx
  ON public.messages (conversation_id, is_read);
