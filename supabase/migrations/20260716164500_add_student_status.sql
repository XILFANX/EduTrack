-- Add status and photo_url if they do not exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='status') THEN 
        ALTER TABLE public.students ADD COLUMN status text DEFAULT 'active'; 
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='photo_url') THEN 
        ALTER TABLE public.students ADD COLUMN photo_url text; 
    END IF;
END $$;

-- Reload Supabase PostgREST schema cache to ensure the API recognizes the new columns immediately
NOTIFY pgrst, 'reload schema';
