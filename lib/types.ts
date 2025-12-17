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
  status: "active" | "expired";
  plan?: MembershipPlan; // For Joined Queries (changed from membership_plans to plan for clarity/mapping)
}

export interface GymClass {
  id: string;
  name: string;
  description: string | null;
  trainer_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  image_slug: string;
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
