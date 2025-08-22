-- This is the initial schema you have already applied.
-- It is included here for project completeness.

-- 1. Create a bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated_images', 'generated_images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for the bucket
-- Allow public read access
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'generated_images' );

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'generated_images' AND owner = auth.uid() );

-- Allow authenticated users to delete their own images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'generated_images' AND owner = auth.uid() );

-- 3. Create the table to store image metadata
CREATE TABLE IF NOT EXISTS public.saved_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    image_url TEXT NOT NULL,
    aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('1:1', '16:9', '4:3')),
    style TEXT NOT NULL CHECK (style IN ('vivid', 'natural')),
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on the saved_images table
ALTER TABLE public.saved_images ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for the saved_images table
-- Allow users to see their own images
CREATE POLICY "Users can view their own images"
ON public.saved_images FOR SELECT
USING ( auth.uid() = user_id );

-- Allow users to insert their own images
CREATE POLICY "Users can insert their own images"
ON public.saved_images FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- Allow users to update their own images (e.g., for favorites)
CREATE POLICY "Users can update their own images"
ON public.saved_images FOR UPDATE
USING ( auth.uid() = user_id );

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON public.saved_images FOR DELETE
USING ( auth.uid() = user_id );
