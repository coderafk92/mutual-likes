
-- Prevent listing all files - only allow accessing specific files by path
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-photos'
  AND auth.role() = 'authenticated'
);
