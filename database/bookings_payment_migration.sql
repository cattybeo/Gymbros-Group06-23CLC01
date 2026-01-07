-- Add status_payment to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS status_payment text DEFAULT 'unpaid';

-- Add unique constraint to prevent double bookings if not exists
-- ALTER TABLE public.bookings ADD CONSTRAINT unique_user_class UNIQUE (user_id, class_id);
