/*
  # [Operation: Add Storage Path to Images Table]
  This migration adds a dedicated column to store the Supabase Storage file path for each image.
  This makes image deletion more robust and reliable.

  ## Query Description:
  - This is a non-destructive operation that adds a new column `storage_file_path` to the `saved_images` table.
  - Existing data will NOT be affected, but the new column will be `NULL` for existing rows.
  - This change makes image deletion more robust by relying on a direct path instead of parsing a URL.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (The column can be dropped)
*/

ALTER TABLE public.saved_images
ADD COLUMN storage_file_path TEXT;
