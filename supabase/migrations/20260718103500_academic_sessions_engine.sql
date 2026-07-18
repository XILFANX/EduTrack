-- Create Academic Years table
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "2024/2025" or "2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint so a school can only have one year active at a time
-- We use a partial index for this constraint.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_year_per_school_idx 
ON public.academic_years (school_id) 
WHERE is_active = true;

-- Update academic_terms table to reference academic_years
ALTER TABLE public.academic_terms ADD COLUMN IF NOT EXISTS year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE;

-- Add partial index so a school can only have one term active at a time
CREATE UNIQUE INDEX IF NOT EXISTS one_active_term_per_school_idx 
ON public.academic_terms (school_id) 
WHERE is_active = true;

-- Enable RLS on academic_years
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- Policies for academic_years
CREATE POLICY "Users can view their school's academic years"
    ON public.academic_years FOR SELECT
    USING (school_id IN (
        SELECT school_id FROM public.users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Admin can insert academic years"
    ON public.academic_years FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.school_id = academic_years.school_id 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update academic years"
    ON public.academic_years FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.school_id = academic_years.school_id 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can delete academic years"
    ON public.academic_years FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.school_id = academic_years.school_id 
            AND users.role = 'admin'
        )
    );
