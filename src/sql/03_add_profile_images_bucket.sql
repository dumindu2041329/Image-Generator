/*
  # [Operation: Create Profile Images Storage Bucket]
  This script creates a dedicated storage bucket for user profile images
  and sets up the necessary security policies.

  ## Query Description:
  - Creates a new storage bucket named 'profile_images'
  - Sets up Row Level Security policies for profile image uploads
  - Allows authenticated users to manage their own profile images

  ## Metadata:
  - Schema-Category: "Storage"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Security Implications:
  - Creates RLS policies for secure profile image management
  - Users can only access their own profile images
  - Public read access for profile images
*/

-- 1. Create Storage Bucket for Profile Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for the profile images bucket

-- Policy: Allow public read access to profile images
DROP POLICY IF EXISTS "Public Read Access for Profile Images" ON storage.objects;
CREATE POLICY "Public Read Access for Profile Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile_images' );

-- Policy: Allow authenticated users to upload profile images to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( 
  bucket_id = 'profile_images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow authenticated users to update their own profile images
DROP POLICY IF EXISTS "Authenticated users can update their profile images" ON storage.objects;
CREATE POLICY "Authenticated users can update their profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( 
  bucket_id = 'profile_images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Allow authenticated users to delete their own profile images
DROP POLICY IF EXISTS "Authenticated users can delete their profile images" ON storage.objects;
CREATE POLICY "Authenticated users can delete their profile images"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
  bucket_id = 'profile_images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);