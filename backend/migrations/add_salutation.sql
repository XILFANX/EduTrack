-- ============================================================
-- EduTrack Migration: Salutation Support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add salutation to users table (stores how a staff member is addressed)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS salutation text;

-- Add target_salutation to invitations table (stores salutation set by admin at invite time)
ALTER TABLE public.invitations 
  ADD COLUMN IF NOT EXISTS target_salutation text;
