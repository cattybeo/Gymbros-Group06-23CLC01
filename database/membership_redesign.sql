-- WARNING: This script will delete existing membership data!
-- Execute this in the Supabase SQL Editor.

-- 1. Drop existing tables (Order matters due to Foreign Keys)
DROP TABLE IF EXISTS public.user_memberships;
DROP TABLE IF EXISTS public.membership_plans; -- Dropping old table

-- 2. Create 'membership_tiers' (The products)
CREATE TABLE public.membership_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- "Silver", "Gold", "Platinum"
  code text UNIQUE NOT NULL, -- "silver", "gold" for code logic
  level int NOT NULL, -- 1, 2, 3 for hierarchy
  features jsonb DEFAULT '[]'::jsonb, -- e.g. ["gym_access", "sauna"]
  image_slug text, -- "tier_silver"
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Create 'membership_plans' (The pricing options)
CREATE TABLE public.membership_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_id uuid REFERENCES public.membership_tiers(id) NOT NULL,
  price decimal(10,2) NOT NULL,
  duration_months int NOT NULL, -- 1, 3, 6, 12
  discount_label text, -- "Save 20%"
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Re-create 'user_memberships'
CREATE TABLE public.user_memberships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES public.membership_plans(id) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view tiers" ON public.membership_tiers FOR SELECT USING (true);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view plans" ON public.membership_plans FOR SELECT USING (true);

ALTER TABLE public.user_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own" ON public.user_memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users subscribe" ON public.user_memberships FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Seed Data
-- Insert Tiers
INSERT INTO public.membership_tiers (name, code, level, features, image_slug) VALUES
('Standard', 'standard', 1, '["gym_access", "locker"]'::jsonb, 'tier_standard'),
('Silver', 'silver', 2, '["gym_access", "locker", "yoga_class"]'::jsonb, 'tier_silver'),
('Gold', 'gold', 3, '["gym_access", "locker", "all_classes", "sauna", "guest_pass"]'::jsonb, 'tier_gold'),
('Platinum', 'platinum', 4, '["gym_access", "locker", "all_classes", "sauna", "guest_pass", "pt_1_week", "towel_service"]'::jsonb, 'tier_platinum');

-- Insert Plans
-- Use DO block to lookup IDs dynamically
DO $$
DECLARE
  standard_id uuid;
  silver_id uuid;
  gold_id uuid;
  platinum_id uuid;
BEGIN
  SELECT id INTO standard_id FROM public.membership_tiers WHERE code = 'standard';
  SELECT id INTO silver_id FROM public.membership_tiers WHERE code = 'silver';
  SELECT id INTO gold_id FROM public.membership_tiers WHERE code = 'gold';
  SELECT id INTO platinum_id FROM public.membership_tiers WHERE code = 'platinum';

  -- Standard
  INSERT INTO public.membership_plans (tier_id, price, duration_months, discount_label) VALUES 
  (standard_id, 300000, 1, NULL),
  (standard_id, 3000000, 12, 'Save 2 months');

  -- Silver
  INSERT INTO public.membership_plans (tier_id, price, duration_months, discount_label) VALUES 
  (silver_id, 500000, 1, NULL),
  (silver_id, 1400000, 3, 'Save 100k');

  -- Gold
  INSERT INTO public.membership_plans (tier_id, price, duration_months, discount_label) VALUES 
  (gold_id, 1200000, 1, NULL),
  (gold_id, 3200000, 3, 'Best Value'),
  (gold_id, 6000000, 6, 'Save 1.2m');

  -- Platinum
  INSERT INTO public.membership_plans (tier_id, price, duration_months, discount_label) VALUES 
  (platinum_id, 2000000, 1, NULL),
  (platinum_id, 20000000, 12, 'VIP Access');

END $$;
