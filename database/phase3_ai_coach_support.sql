-- Migration: Phase 3 - AI Coach & Attendance Enhancement
-- Support class-specific attendance logging for trainers

-- 1. Add class_id to access_logs if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'access_logs' AND column_name = 'class_id') THEN
        ALTER TABLE public.access_logs ADD COLUMN class_id UUID REFERENCES public.classes(id);
    END IF;
END $$;

-- 2. Update RLS for Personal Trainers (PT)
-- We need to make sure PT can record attendance for their OWN classes
DROP POLICY IF EXISTS "Staff can insert access logs" ON public.access_logs;
CREATE POLICY "Trainers and Staff can insert access logs" ON public.access_logs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Staff', 'Admin', 'PT')
  )
);

DROP POLICY IF EXISTS "Staff can view all logs" ON public.access_logs;
CREATE POLICY "Trainers and Staff can view logs" ON public.access_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Staff', 'Admin', 'PT')
  )
);
