-- Create a function to set up avatar storage policies
CREATE OR REPLACE FUNCTION public.set_avatar_policies()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow public read access to avatars
  DROP POLICY IF EXISTS "Public read access" ON storage.objects;
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

  -- Allow authenticated users to upload their own avatars
  DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
  CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Allow users to update their own avatars
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

  -- Allow users to delete their own avatars
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
END;
$$;
