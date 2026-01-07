-- Migration: Class Status and Trainer Detail Fields (V1.6)
-- Description: Adds status tracking to classes and detail fields for trainers.

-- 1. Add status to classes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='status') THEN
        ALTER TABLE public.classes ADD COLUMN status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'cancelled'));
    END IF;
END $$;

-- 2. Ensure bio and specialties exist (they should, but just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialties') THEN
        ALTER TABLE public.profiles ADD COLUMN specialties TEXT[];
    END IF;
END $$;
