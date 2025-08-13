-- Set up avatar storage bucket and policies
-- This migration ensures the avatars storage bucket exists and has proper RLS policies

-- Create the avatars storage bucket if it doesn't exist
-- Note: Storage buckets are created through the Supabase dashboard or CLI
-- This migration focuses on setting up the policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create policy for public read access to avatars
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Create policy for users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create policy for users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add avatar column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add comment for the avatar field
COMMENT ON COLUMN profiles.avatar IS 'URL or path to user avatar image'; 