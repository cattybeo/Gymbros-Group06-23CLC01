-- Migration: Trainer Student Optimization RPC (V1.7)
-- Description: Adds a high-performance RPC to fetch unique students for a trainer.

CREATE OR REPLACE FUNCTION public.get_trainer_students(p_trainer_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  booking_count BIGINT,
  last_booking TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    COUNT(b.id) AS booking_count,
    MAX(b.booking_date) AS last_booking
  FROM public.profiles p
  JOIN public.bookings b ON b.user_id = p.id
  JOIN public.classes c ON c.id = b.class_id
  WHERE c.trainer_id = p_trainer_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
