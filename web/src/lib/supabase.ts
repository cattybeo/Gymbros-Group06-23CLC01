import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://riohablyuuujoiyifilv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb2hhYmx5dXV1am9peWlmaWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTMyODgsImV4cCI6MjA3OTU2OTI4OH0.s9HqEe0WsD8H3vr9rp7OAXwcKXDQJohbdxsy4-0ehqo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type AppRole = 'Admin' | 'Staff' | 'Member' | 'PT';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  role: AppRole;
  phone?: string | null;
  bio?: string | null;
  goal?: string | null;
  gender?: string | null;
  birthday?: string | null;
  activity_level?: string | null;
  experience_level?: string | null;
  weekly_availability?: string | null;
  specialties?: string[] | null;
  metadata?: any;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  image_slug: string | null;
  created_at: string;
}

export interface GymClass {
  id: string;
  name: string;
  description: string | null;
  trainer_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  image_slug: string | null;
  location_id: string | null;
  created_at: string;
  trainer?: Profile;
  location?: Location;
  bookings_count?: number;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  booking_date: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  status_payment: 'paid' | 'unpaid';
  user?: Profile;
  class?: GymClass;
}

export interface MembershipTier {
  id: string;
  name: string;
  code: string;
  level: number;
  features: string[];
  image_slug: string | null;
  created_at: string;
}

export interface MembershipPlan {
  id: string;
  tier_id: string;
  price: number;
  duration_months: number;
  discount_label: string | null;
  is_active: boolean;
  created_at: string;
  tier?: MembershipTier;
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  user?: Profile;
  plan?: MembershipPlan;
}
