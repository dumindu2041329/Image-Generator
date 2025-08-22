/*
# [Operation] Add Storage File Path Column
This script adds a 'storage_file_path' column to the 'saved_images' table. This is crucial for reliably deleting images from Supabase Storage.

## Query Description:
- This is a non-destructive operation that adds a new, nullable column to an existing table.
- Existing data will NOT be affected. The new column will be `NULL` for existing rows.
- This change is required for the image deletion feature to work correctly and robustly.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (The column can be dropped if needed)

## Structure Details:
- Table Affected: `saved_images`
- Column Added: `storage_file_path` (TEXT)

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: Requires permissions to alter the `saved_images` table.

## Performance Impact:
- Indexes: None added.
- Estimated Impact: Negligible. Adding a nullable column is a fast metadata change.
*/

ALTER TABLE public.saved_images
ADD COLUMN IF NOT EXISTS storage_file_path TEXT;
