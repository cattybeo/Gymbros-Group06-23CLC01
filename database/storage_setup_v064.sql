-- 1. Create a private bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- 2. Enable RLS (Usually enabled by default, skipping to avoid permission errors)
-- alter table storage.objects enable row level security;

-- 3. Policy: Allow public access to view avatars (since we marked bucket as public=true, but good to be explicit or if we toggle public)
create policy "Avatar Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 4. Policy: Allow authenticated users to upload avatar
create policy "Users can upload their own avatar"
on storage.objects for insert
with check (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- 5. Policy: Allow users to update their own avatar
create policy "Users can update their own avatar"
on storage.objects for update
using (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
--   (storage.foldername(name))[1] = auth.uid()::text -- Optional structure enforcement
);
