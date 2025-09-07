-- Supabase setup for generated images only (Clerk-authenticated)
-- - Creates table public.saved_images
-- - Creates storage bucket generated_images
-- - Adds RLS policies using Clerk JWT sub as user id

-- Enable required extension
create extension if not exists pgcrypto;

-- Helper to read external JWT (e.g., Clerk) sub claim
create or replace function public.auth_ext_id()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub',''),
    nullif(current_setting('request.jwt.claims', true)::jsonb->>'user_id','')
  );
$$;

-- Table: saved_images
create table if not exists public.saved_images (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  prompt text not null,
  image_url text not null,
  aspect_ratio text not null check (aspect_ratio in ('1:1','16:9','4:3')),
  style text not null check (style in ('vivid','natural')),
  created_at timestamptz not null default now(),
  is_favorite boolean not null default false,
  storage_file_path text
);

-- RLS: only owner can access rows
alter table public.saved_images enable row level security;

drop policy if exists "saved_images_select_own" on public.saved_images;
drop policy if exists "saved_images_insert_own" on public.saved_images;
drop policy if exists "saved_images_update_own" on public.saved_images;
drop policy if exists "saved_images_delete_own" on public.saved_images;

create policy "saved_images_select_own"
on public.saved_images
for select
to authenticated
using (user_id = public.auth_ext_id());

create policy "saved_images_insert_own"
on public.saved_images
for insert
to authenticated
with check (user_id = public.auth_ext_id());

create policy "saved_images_update_own"
on public.saved_images
for update
to authenticated
using (user_id = public.auth_ext_id())
with check (user_id = public.auth_ext_id());

create policy "saved_images_delete_own"
on public.saved_images
for delete
to authenticated
using (user_id = public.auth_ext_id());

-- Storage bucket for generated images
insert into storage.buckets (id, name, public)
values ('generated_images','generated_images', true)
on conflict (id) do nothing;

-- Storage policies: public read; owner write/update/delete in own folder
drop policy if exists "public_read_generated" on storage.objects;
drop policy if exists "write_own_generated_insert" on storage.objects;
drop policy if exists "write_own_generated_update" on storage.objects;
drop policy if exists "write_own_generated_delete" on storage.objects;

create policy "public_read_generated"
on storage.objects
for select
using (bucket_id = 'generated_images');

create policy "write_own_generated_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'generated_images'
  and position(public.auth_ext_id() || '/' in name) = 1
);

create policy "write_own_generated_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'generated_images'
  and position(public.auth_ext_id() || '/' in name) = 1
);

create policy "write_own_generated_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'generated_images'
  and position(public.auth_ext_id() || '/' in name) = 1
);


