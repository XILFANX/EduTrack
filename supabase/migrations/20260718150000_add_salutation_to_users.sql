-- Add salutation column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS salutation VARCHAR(10);
