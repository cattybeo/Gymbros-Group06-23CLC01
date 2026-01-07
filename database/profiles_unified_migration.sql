-- ==========================================
-- Gymbros Unified Profiles & Locations Migration
-- Version: 1.4.3 (Diamond Standard with Location Fix)
-- Description: Unified public.profiles table to avoid auth.users join limitations.
-- ==========================================

-- 0. CLEANUP (Optional: Only if you want to start fresh)
-- DROP VIEW IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'Member' CHECK (role IN ('Admin', 'Staff', 'PT', 'Member')),
  phone TEXT,
  bio TEXT,
  goal TEXT,
  gender TEXT,
  birthday DATE,
  activity_level TEXT,
  experience_level TEXT,
  weekly_availability TEXT,
  specialties TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  description TEXT,
  image_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);

-- 3. INITIAL SEED LOCATIONS (Before FK constraints)
INSERT INTO public.locations (name, address, description, image_slug) VALUES
('Gymbros District 1', '65 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh', 'Studio cao cấp trung tâm thành phố.', 'studio_a'),
('Gymbros District 7', '101 Tôn Dật Tiên, Tân Phong, Quận 7, TP. Hồ Chí Minh', 'Không gian tập luyện chuyên nghiệp tại Phú Mỹ Hưng.', 'studio_b'),
('Gymbros District 3', '202 Võ Văn Tần, Phường 5, Quận 3, TP. Hồ Chí Minh', 'Studio Yoga và Pilates chuyên biệt.', 'outdoor_deck')
ON CONFLICT DO NOTHING;

-- 4. SYNC EXISTING USERS (CRITICAL: Must run BEFORE adding Foreign Keys)
INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
SELECT 
  id, 
  raw_user_meta_data->>'full_name', 
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
  email,
  COALESCE(raw_user_meta_data->>'role', 'Member')
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  role = EXCLUDED.role,
  updated_at = now();

-- 5. ADD LOCATION_ID TO CLASSES (Safe Add)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='classes' AND column_name='location_id') THEN
        ALTER TABLE public.classes ADD COLUMN location_id uuid;
    END IF;
END $$;

-- 6. DATA CLEANUP (CRITICAL: Fix Data BEFORE creating Constraints)
-- 6a. Fix invalid location_ids (IDs that point to non-existent locations)
UPDATE public.classes 
SET location_id = (SELECT id FROM public.locations ORDER BY created_at ASC LIMIT 1)
WHERE location_id IS NOT NULL 
  AND location_id NOT IN (SELECT id FROM public.locations);

-- 6b. Populate NULL location_ids
UPDATE public.classes 
SET location_id = (SELECT id FROM public.locations ORDER BY created_at ASC LIMIT 1) 
WHERE location_id IS NULL;

-- 7. APPLY CONSTRAINTS (Now safe because data is valid)
-- Location FK
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_location_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);

-- Trainer FK
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_trainer_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.profiles(id);

-- Bookings & Memberships FKs
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.user_memberships DROP CONSTRAINT IF EXISTS user_memberships_user_id_fkey;
ALTER TABLE public.user_memberships ADD CONSTRAINT user_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- 8. AUTH SYNC TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'Member')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
