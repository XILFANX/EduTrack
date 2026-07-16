-- ============================================================
-- STEP 1: Prerequisite tables that may not exist yet
-- ============================================================

-- Library Books (master inventory of all books in the school)
CREATE TABLE IF NOT EXISTS public.library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    isbn TEXT,
    author TEXT,
    status TEXT NOT NULL DEFAULT 'available', -- 'available', 'borrowed', 'lost'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inventory Ledger (store kitchen/stationery in/out log)
CREATE TABLE IF NOT EXISTS public.inventory_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    transaction_type TEXT NOT NULL, -- 'in' or 'out'
    notes TEXT,
    logged_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- STEP 2: New tables for the portal feature set
-- ============================================================

-- Bursar Invoices (per-student, per-term billing)
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    amount_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Library Issues (book checkout/return log)
CREATE TABLE IF NOT EXISTS public.library_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    fine_amount NUMERIC(10,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'borrowed', -- 'borrowed', 'returned', 'lost'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transport Routes (bus route definitions)
CREATE TABLE IF NOT EXISTS public.transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    driver_name TEXT,
    vehicle_plate TEXT,
    capacity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transport Logs (daily boarding/alighting records)
CREATE TABLE IF NOT EXISTS public.transport_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'boarded', 'dropped', 'absent'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================
-- STEP 3: Enable Row Level Security on all new tables
-- ============================================================

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: RLS Policies (school-level isolation, idempotent)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_books' AND policyname = 'School isolation for library_books') THEN
    CREATE POLICY "School isolation for library_books" ON public.library_books FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_ledger' AND policyname = 'School isolation for inventory_ledger') THEN
    CREATE POLICY "School isolation for inventory_ledger" ON public.inventory_ledger FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'School isolation for invoices') THEN
    CREATE POLICY "School isolation for invoices" ON public.invoices FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'library_issues' AND policyname = 'School isolation for library_issues') THEN
    CREATE POLICY "School isolation for library_issues" ON public.library_issues FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_routes' AND policyname = 'School isolation for transport_routes') THEN
    CREATE POLICY "School isolation for transport_routes" ON public.transport_routes FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transport_logs' AND policyname = 'School isolation for transport_logs') THEN
    CREATE POLICY "School isolation for transport_logs" ON public.transport_logs FOR ALL USING (school_id = (SELECT school_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Reload Supabase PostgREST schema cache
NOTIFY pgrst, 'reload schema';
