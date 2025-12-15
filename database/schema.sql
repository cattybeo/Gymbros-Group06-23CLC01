-- 1. Membership Plans (Fixed list of plans: Gold, Silver...)
create table public.membership_plans (
  id uuid default gen_random_uuid() primary key,
  name text not null, -- e.g. "Gold Package"
  description text,
  price decimal(10,2) not null,
  duration_months int not null,
  image_slug text, -- e.g. "gold_pack"
  created_at timestamp with time zone default now()
);

-- RLS for Membership Plans
alter table public.membership_plans enable row level security;
create policy "Anyone can view plans" on public.membership_plans for select using (true);


-- 2. User Memberships
create table public.user_memberships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  plan_id uuid references public.membership_plans(id) not null,
  start_date date not null,
  end_date date not null,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- RLS for User Memberships
alter table public.user_memberships enable row level security;
create policy "Users can view own memberships" on public.user_memberships for select using (auth.uid() = user_id);
create policy "Users can buy memberships" on public.user_memberships for insert with check (auth.uid() = user_id);


-- 3. Classes
create table public.classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  trainer_id uuid references auth.users(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  capacity int default 20,
  image_slug text, -- e.g. "morning_yoga"
  created_at timestamp with time zone default now()
);

-- RLS for Classes
alter table public.classes enable row level security;
create policy "Anyone can view classes" on public.classes for select using (true);


-- 4. Bookings
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  class_id uuid references public.classes(id) not null,
  booking_date timestamp with time zone default now(),
  status text default 'confirmed'
);

-- RLS for Bookings
alter table public.bookings enable row level security;
create policy "Users can view own bookings" on public.bookings for select using (auth.uid() = user_id);
create policy "Users can create bookings" on public.bookings for insert with check (auth.uid() = user_id);
-- (Optional) Prevent deleting bookings for now, or add policy later.


-- SEED DATA (Updated with image_slugs)
insert into public.membership_plans (name, description, price, duration_months, image_slug) values
('Silver Pack', 'Gói tập cơ bản cho người mới bắt đầu, truy cập thiết bị tiêu chuẩn.', 500000, 3, 'silver_pack'),
('Gold Pack', 'Gói nâng cao với quyền truy cập khu vực VIP và khăn tắm miễn phí.', 1200000, 6, 'gold_pack'),
('Platinum Pack', 'Gói thượng hạng, không giới hạn tiện ích, PT cá nhân tuần/lần.', 2000000, 12, 'platinum_pack');

insert into public.classes (name, description, start_time, end_time, capacity, image_slug) values
('Morning Yoga', 'Khởi động ngày mới với bài tập Yoga nhẹ nhàng giúp thư giãn tâm trí.', now() + interval '1 day' + interval '7 hours', now() + interval '1 day' + interval '8 hours', 15, 'morning_yoga'),
('HIIT Cardio', 'Bài tập cường độ cao giúp đốt cháy calo và cải thiện sức bền tim mạch.', now() + interval '2 days' + interval '18 hours', now() + interval '2 days' + interval '19 hours', 20, 'hiit_cardio'),
('Body Pump', 'Tập tạ toàn thân theo nhịp điệu âm nhạc sôi động, tăng cường cơ bắp.', now() + interval '3 days' + interval '17 hours', now() + interval '3 days' + interval '18 hours', 20, 'body_pump');
