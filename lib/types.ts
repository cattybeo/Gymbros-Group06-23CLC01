export interface MembershipTier {
  id: string;
  name: string;
  code: string;
  level: number;
  features: string[]; // JSONB stored as array of strings
  image_slug: string;
}

export interface MembershipPlan {
  id: string;
  tier_id: string;
  price: number;
  duration_months: number;
  discount_label: string | null;
  tier?: MembershipTier; // Joined
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "cancelled";
  plan?: MembershipPlan; // For Joined Queries (changed from membership_plans to plan for clarity/mapping)
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  description: string | null;
  image_slug: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string | null;
  role: "Admin" | "Staff" | "PT" | "Member";
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
}

export interface GymClass {
  id: string;
  name: string;
  description: string | null;
  trainer_id: string | null;
  location_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  image_slug: string;
  trainer?: Profile; // Joined from public.profiles
  location?: Location; // Joined from public.locations
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  booking_date: string;
  status: string;
}

export interface BodyIndex {
  id?: string;
  user_id: string;
  height: number;
  weight: number;
  age: number;
  gender: string;
  goal: string;
  record_day: string;
  created_at?: string;
}
