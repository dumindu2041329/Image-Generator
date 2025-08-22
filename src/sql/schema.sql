-- SQL SCRIPT TO FIX PERMISSION ERROR AND SETUP IMAGE HISTORY

-- This script is safe to run multiple times.

-- 1. Create Storage Bucket for Generated Images
-- This bucket will store the actual image files.
-- We are making it public for easy access via URL, but access control
-- for uploads and deletes will be handled by policies.
insert into storage.buckets
  (id, name, public)
values
  ('generated_images', 'generated_images', true)
on conflict (id) do nothing;

-- 2. Create Policies for Storage Bucket
-- These policies control who can do what in the storage bucket.

-- Policy: Allow authenticated users to view their own images.
-- This uses the user's ID from the token to match the file path.
drop policy if exists "Authenticated users can view their own images" on storage.objects;
create policy "Authenticated users can view their own images"
on storage.objects for select
to authenticated
using ( bucket_id = 'generated_images' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- Policy: Allow authenticated users to upload images into their own folder.
-- The folder name will be their user ID.
drop policy if exists "Authenticated users can upload images" on storage.objects;
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'generated_images' AND auth.uid() = (storage.foldername(name))[1]::uuid );

-- Policy: Allow authenticated users to delete their own images.
drop policy if exists "Authenticated users can delete their own images" on storage.objects;
create policy "Authenticated users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'generated_images' AND auth.uid() = (storage.foldername(name))[1]::uuid );


-- 3. Create Table for Saved Image Metadata
-- This table stores information about each generated image.
create table if not exists public.saved_images (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  image_url text not null, -- This will be the URL from Supabase Storage
  aspect_ratio text not null,
  style text not null,
  is_favorite boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add comments to explain the table and columns
comment on table public.saved_images is 'Stores metadata for images generated and saved by users.';
comment on column public.saved_images.user_id is 'Links to the user who generated the image.';
comment on column public.saved_images.image_url is 'Public URL of the image stored in Supabase Storage.';


-- 4. Enable Row Level Security (RLS) on the table
-- This is a crucial security step.
alter table public.saved_images enable row level security;


-- 5. Create RLS Policies for the saved_images table
-- These policies ensure that users can only interact with their own data.

-- Policy: Allow users to see their own saved images.
drop policy if exists "Users can view their own saved images" on public.saved_images;
create policy "Users can view their own saved images"
on public.saved_images for select
to authenticated
using ( auth.uid() = user_id );

-- Policy: Allow users to insert their own saved images.
drop policy if exists "Users can insert their own saved images" on public.saved_images;
create policy "Users can insert their own saved images"
on public.saved_images for insert
to authenticated
with check ( auth.uid() = user_id );

-- Policy: Allow users to update their own saved images (e.g., toggling favorite).
drop policy if exists "Users can update their own saved images" on public.saved_images;
create policy "Users can update their own saved images"
on public.saved_images for update
to authenticated
using ( auth.uid() = user_id );

-- Policy: Allow users to delete their own saved images.
drop policy if exists "Users can delete their own saved images" on public.saved_images;
create policy "Users can delete their own saved images"
on public.saved_images for delete
to authenticated
using ( auth.uid() = user_id );
