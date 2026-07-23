-- ================================================================
-- Migration: Add dev_docs_pin_hash to users table
-- Run this in your Supabase SQL Editor for both EduTrack
-- and EstateTrack databases.
-- ================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS dev_docs_pin_hash text;

-- No RLS policy needed — the PIN is only written/read by Server Actions
-- that authenticate via supabase.auth.getUser() first, and the column
-- is not exposed via any public API or policy.
