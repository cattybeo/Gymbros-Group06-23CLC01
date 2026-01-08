-- ==========================================
-- MIGRATION: Heatmap & AI Forecast Support (V3 - REALISTIC)
-- ==========================================

-- 1. Create RPC to get Weekly Traffic Heatmap (Aggregated 30 Days)
-- Strategy: Show REAL data if exists, otherwise fallback to MOCK data for demo
CREATE OR REPLACE FUNCTION get_weekly_traffic()
RETURNS TABLE (
    day_of_week INT,
    hour_of_day INT,
    traffic_score FLOAT
) AS $$
DECLARE
    real_data_count INT;
BEGIN
    -- Check if we have real user bookings in last 30 days
    SELECT COUNT(*) INTO real_data_count
    FROM public.bookings b
    INNER JOIN auth.users u ON u.id = b.user_id
    WHERE b.status IN ('confirmed', 'checked_in', 'completed')
    AND b.booking_date >= (NOW() - INTERVAL '30 days')
    AND u.email != 'heatmap_bot@gymbros.io';

    -- If we have real data (>10 bookings), use ONLY real data
    -- Otherwise, include bot data for demo purposes
    IF real_data_count > 10 THEN
        RETURN QUERY
        SELECT 
            EXTRACT(DOW FROM (b.booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh'))::INT as day_of_week,
            EXTRACT(HOUR FROM (b.booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh'))::INT as hour_of_day,
            LEAST(COUNT(b.id)::FLOAT / 60.0, 1.0) as traffic_score
        FROM public.bookings b
        INNER JOIN auth.users u ON u.id = b.user_id
        WHERE b.status IN ('confirmed', 'checked_in', 'completed')
        AND b.booking_date >= (NOW() - INTERVAL '30 days')
        AND u.email != 'heatmap_bot@gymbros.io'
        GROUP BY 1, 2
        ORDER BY 1, 2;
    ELSE
        -- Fallback: Include bot data for demo
        RETURN QUERY
        SELECT 
            EXTRACT(DOW FROM (booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh'))::INT as day_of_week,
            EXTRACT(HOUR FROM (booking_date AT TIME ZONE 'Asia/Ho_Chi_Minh'))::INT as hour_of_day,
            LEAST(COUNT(id)::FLOAT / 60.0, 1.0) as traffic_score
        FROM public.bookings
        WHERE status IN ('confirmed', 'checked_in', 'completed')
        AND booking_date >= (NOW() - INTERVAL '30 days')
        GROUP BY 1, 2
        ORDER BY 1, 2;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Mock Data Generator (Enhanced for Colorful Heatmap & Clean History)
DO $$
DECLARE
    target_class_id UUID;
    mock_user_id UUID;
    i INT;
    simulated_date TIMESTAMP;
    random_hour INT;
    dow INT;
    weight FLOAT;
BEGIN
    -- A. GET OR CREATE MOCK USER (Bot)
    -- This prevents polluting the developer's real account with 2000+ bookings.
    SELECT id INTO mock_user_id FROM auth.users WHERE email = 'heatmap_bot@gymbros.io' LIMIT 1;

    IF mock_user_id IS NULL THEN
        mock_user_id := gen_random_uuid();
        -- Insert a dummy user into auth.users (requires Postgres role privileges)
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
        VALUES (
            mock_user_id,
            'heatmap_bot@gymbros.io',
            '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhash', -- Fake password hash
            NOW(),
            'authenticated',
            'authenticated',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Created new Mock User: heatmap_bot@gymbros.io';
    ELSE 
        RAISE NOTICE 'Using existing Mock User: %', mock_user_id;
    END IF;

    -- B. CLEANUP ONLY MOCK DATA
    -- Only delete bookings belonging to the bot or old completed bookings that might be orphaned
    DELETE FROM public.bookings WHERE user_id = mock_user_id;

    -- C. GENERATE HEATMAP DATA
    -- Increase sample size to 2500 for better density coverage
    FOR i IN 1..2500 LOOP 
        SELECT id INTO target_class_id FROM public.classes ORDER BY RANDOM() LIMIT 1;
        
        IF target_class_id IS NOT NULL THEN
            -- Random date in last 30 days
            simulated_date := DATE_TRUNC('day', NOW()) - (FLOOR(RANDOM() * 30) || ' days')::INTERVAL;
            dow := EXTRACT(DOW FROM simulated_date)::INT;

            -- REJECTION SAMPLING FOR REALISTIC CURVES
            -- Loop until we find an hour that fits the probability curve
            LOOP
                random_hour := 6 + FLOOR(RANDOM() * 16); -- 6 AM to 10 PM
                weight := RANDOM();
                
                -- Weekdays (Mon=1 to Fri=5)
                IF dow IN (1, 2, 3, 4, 5) THEN 
                    -- Super Peak (Red): 17h-19h (High probability)
                    IF random_hour IN (17, 18, 19) AND weight < 0.85 THEN EXIT;
                    -- Morning Rush (Yellow/Red): 6h-8h
                    ELSIF random_hour IN (6, 7, 8) AND weight < 0.65 THEN EXIT;
                    -- Lunch Break (Yellow): 11h-13h
                    ELSIF random_hour IN (11, 12, 13) AND weight < 0.40 THEN EXIT;
                    -- Dead Zones (Green): 9h-10h, 14h-16h
                    ELSIF random_hour IN (9, 10, 14, 15, 16) AND weight < 0.15 THEN EXIT;
                    -- Late Night (Green)
                    ELSIF random_hour >= 20 AND weight < 0.10 THEN EXIT;
                    END IF;
                
                -- Weekends (Sun=0, Sat=6)
                ELSE 
                    -- Late Mornings (Yellow/Red): 8h-11h
                    IF random_hour IN (8, 9, 10, 11) AND weight < 0.60 THEN EXIT;
                    -- Lazy Afternoons (Green/Yellow): 14h-17h
                    ELSIF random_hour IN (14, 15, 16, 17) AND weight < 0.30 THEN EXIT;
                    -- Other (rare)
                     ELSIF weight < 0.05 THEN EXIT;
                    END IF;
                END IF;
            END LOOP;

            -- Set final timestamp
            simulated_date := simulated_date + (random_hour || ' hours')::INTERVAL + (FLOOR(RANDOM() * 60) || ' minutes')::INTERVAL;

            INSERT INTO public.bookings (user_id, class_id, booking_date, status)
            VALUES (mock_user_id, target_class_id, simulated_date, 'completed');
        END IF;
    END LOOP;

    RAISE NOTICE 'Realistic Colorful Heatmap data generated.';
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
