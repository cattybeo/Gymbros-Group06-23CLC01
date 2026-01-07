-- ==========================================
-- MIGRATION: Trainer Profile Expansion (V1.5)
-- Description: Adds experience tracking and social contact links for Trainers (PTs).
-- ==========================================

-- 1. Add new columns to PROFILES table
DO $$ 
BEGIN
    -- Years of Experience (Quantitative)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='experience_years') THEN
        ALTER TABLE public.profiles ADD COLUMN experience_years INT DEFAULT 0;
    END IF;

    -- Social Links (Zalo, Messenger, Facebook, etc.)
    -- Structure: { "zalo": "0909...", "messenger": "username", "facebook": "url" }
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='social_links') THEN
        ALTER TABLE public.profiles ADD COLUMN social_links JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Certificates / Achievements (Rich Text or Array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='certificates') THEN
        ALTER TABLE public.profiles ADD COLUMN certificates TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Mock Data Update for Trainers (Example)
-- Update existing trainers (role = 'PT' or 'Staff') with dummy data for testing
UPDATE public.profiles
SET 
    experience_years = floor(random() * 10 + 1)::int,
    specialties = CASE 
        WHEN array_length(specialties, 1) IS NULL THEN ARRAY['HIIT', 'Cardio', 'Weight Loss'] 
        ELSE specialties 
    END,
    social_links = jsonb_build_object(
        'zalo', COALESCE(phone, '0901234567'),
        'messenger', 'zuck' 
    ),
    certificates = ARRAY['Certified Personal Trainer (NASM)', 'CPR/AED Certified']
WHERE role IN ('PT', 'Staff') AND experience_years = 0;
