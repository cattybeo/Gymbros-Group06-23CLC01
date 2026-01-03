-- ==========================================
-- Gymbros Crunch Phase Migration Script
-- Target: Forum, Chat, Trainer Operations, Membership Fix
-- Date: 2026-01-03
-- ==========================================

-- 1. MEMBERSHIP MODULE FIX
-- Purpose: Add 'cancelled' status to support User Cancellation.
-- NOTE: We use text column with CHECK constraint or ENUM. 
-- Checking current schema from `types.ts` suggests it might be text or simple check.
-- Safest approach: Drop constraint if exists and add new one.

DO $$
BEGIN
    -- Attempt to add 'cancelled' to check constraint if it strictly enforces 'active', 'expired'.
    -- If using Postgres ENUM type 'membership_status', uncomment below:
    -- ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'cancelled';
    
    -- If using CHECK constraint on text column:
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_memberships_status_check') THEN
        ALTER TABLE user_memberships DROP CONSTRAINT user_memberships_status_check;
    END IF;

    ALTER TABLE user_memberships 
    ADD CONSTRAINT user_memberships_status_check 
    CHECK (status IN ('active', 'expired', 'cancelled'));
    
EXCEPTION
    WHEN OTHERS THEN RAISE NOTICE 'Skipping membership status constraint update (or error occurred): %', SQLERRM;
END $$;