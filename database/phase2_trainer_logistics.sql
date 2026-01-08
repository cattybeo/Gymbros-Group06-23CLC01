-- Phase 2: Trainer Logistics & Attendance

-- 1. Create Access Logs table for Staff/Gatekeeping
create table if not exists public.access_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  staff_id uuid references public.profiles(id), -- Nullable if automated gate
  entered_at timestamptz default now(),
  gate_location text -- e.g. "Main Lobby", "Turnstile 1"
);

-- RLS for access_logs
alter table public.access_logs enable row level security;

-- Policy: Staff/Admin can insert
create policy "Staff can insert access logs" on public.access_logs for insert with check (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Staff', 'Admin')
  )
);

-- Policy: Users can view their own logs
create policy "Users can view own access logs" on public.access_logs for select using (
  auth.uid() = user_id
);

-- Policy: Staff/Admin can view all logs
create policy "Staff can view all logs" on public.access_logs for select using (
  exists (
    select 1 from public.profiles 
    where id = auth.uid() 
    and role in ('Staff', 'Admin')
  )
);


-- 2. Enhance Bookings table for Class Lifecycle
-- New logical statuses: 'arrived' (checked-in at gate), 'completed' (checked-out by trainer), 'absent'
-- Note: 'status' column is text, so no ENUM modification needed.

alter table public.bookings 
add column if not exists checkout_at timestamptz,
add column if not exists trainer_rating int check (trainer_rating between 1 and 5),
add column if not exists trainer_note text;

-- Policy: Trainers can UPDATE bookings for their own classes (to mark attendance)
create policy "Trainers can update bookings for their classes" on public.bookings for update using (
  exists (
    select 1 from public.classes 
    where classes.id = bookings.class_id 
    and classes.trainer_id = auth.uid()
  )
);

-- Policy: Trainers can VIEW bookings for their own classes
create policy "Trainers can view bookings for their classes" on public.bookings for select using (
  exists (
    select 1 from public.classes 
    where classes.id = bookings.class_id 
    and classes.trainer_id = auth.uid()
  )
);
