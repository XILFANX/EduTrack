-- Run this script if you have already applied the production_migration.sql
-- It safely adds the middle_name column to the students table.

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS middle_name text;
