-- Allow users with role 'dev' to manage all avatar files
-- This complements user-specific policies by granting broader access to developer/admins

-- Delete existing policy if present to avoid duplicates
DROP POLICY IF EXISTS "Dev users can manage any avatars" ON storage.objects;

CREATE POLICY "Dev users can manage any avatars"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'avatars' AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'dev'
  )
)
WITH CHECK (
  bucket_id = 'avatars' AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'dev'
  )
); 