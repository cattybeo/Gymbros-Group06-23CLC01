export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_months: number;
  image_slug: string;
}

export interface UserMembership {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired";
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
