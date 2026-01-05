-- ==========================================
-- MIGRATION: Heatmap & AI Forecast Support
-- ==========================================

-- 1. Create RPC to get Weekly Traffic Heatmap
-- Logic: Aggregates bookings by Day of Week (0=Sun, 6=Sat) and Hour (0-23).
-- Returns a traffic score (0.0 to 1.0) based on an estimated Gym Capacity (e.g., 50 concurrent users).

CREATE OR REPLACE FUNCTION get_weekly_traffic()
RETURNS TABLE (
    day_of_week INT,
    hour_of_day INT,
    traffic_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Fix: Convert to Vietnam Time (UTC+7) before extracting Hour/DOW
        -- We use a fixed offset '+07' or 'Asia/Ho_Chi_Minh' to ensure "18:00" means 6PM locally.
        EXTRACT(DOW FROM booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::INT as day_of_week,
        EXTRACT(HOUR FROM booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh')::INT as hour_of_day,
        -- Calculate score: Count bookings / Max Capacity (e.g., 50)
        -- Cap at 1.0
        LEAST(COUNT(id)::FLOAT / 50.0, 1.0) as traffic_score
    FROM bookings
    WHERE booking_date >= (NOW() - INTERVAL '30 days') -- Analyze last 30 days
    GROUP BY 1, 2
    ORDER BY 1, 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Fix: Bypass RLS to read all bookings


-- 2. Mock Data Generator (Run manually if needed)
-- This block inserts dummy bookings to simulate a busy gym.
-- It avoids inserting if data already exists to prevent duplicate spam on re-runs.

DO $$
DECLARE
    dummy_class_id UUID;
    dummy_user_id UUID;
    i INT;
    simulated_date TIMESTAMP;
    random_hour INT;
    random_day_offset INT;
BEGIN
    -- Get a valid class and user to link bookings to (fallback if empty table)
    -- Get a valid user to link bookings to (fallback if empty table)
    SELECT id INTO dummy_user_id FROM auth.users LIMIT 1;

    -- Only insert if we have a class and user, and table is relatively empty (< 10 rows)
    IF dummy_class_id IS NOT NULL AND dummy_user_id IS NOT NULL AND (SELECT COUNT(*) FROM bookings) < 10 THEN
        
        -- Insert 200 mock bookings dispersed over last week
        FOR i IN 1..200 LOOP
            -- Random class from existing classes
            SELECT id INTO dummy_class_id FROM public.classes ORDER BY RANDOM() LIMIT 1;
            
            -- Random hour between 6 (6AM) and 22 (10PM) with bias towards peak (17-19)
            -- Simple Rand: 6 + Floor(Random * 16)
            random_hour := 6 + FLOOR(RANDOM() * 16);
            
            -- Peak Hour Boost: If > 0.7, force to 17-19 (5PM-7PM)
            IF RANDOM() > 0.7 THEN
                random_hour := 17 + FLOOR(RANDOM() * 3);
            END IF;

            random_day_offset := FLOOR(RANDOM() * 7); -- 0 to 6 days ago

            simulated_date := NOW() - (random_day_offset || ' days')::INTERVAL;
            -- Set hour
            simulated_date := DATE_TRUNC('hour', simulated_date) + (random_hour || ' hours')::INTERVAL;

            INSERT INTO public.bookings (user_id, class_id, booking_date, status)
            VALUES (dummy_user_id, dummy_class_id, simulated_date, 'confirmed');
        END LOOP;
        
        RAISE NOTICE 'Inserted 200 mock bookings for Heatmap simulation.';
    ELSE
        RAISE NOTICE 'Skipping mock data: Classes/Users missing or Bookings table already populated.';
    END IF;
END $$;

-- 3. NEW: Get Class Counts (Bypass RLS)
create or replace function public.get_class_counts(class_ids uuid[])
returns table (
  class_id uuid,
  count bigint
) 
language plpgsql
security definer -- Bypass RLS to count ALL bookings
as $$
begin
  return query
  select 
    b.class_id, 
    count(*)::bigint
  from public.bookings b
  where b.class_id = any(class_ids)
  and b.status in ('confirmed', 'checked_in')
  group by b.class_id;
end;
$$;
