
-- Profile photos are public-facing content in a social app - revert to public
UPDATE storage.buckets SET public = true WHERE id = 'profile-photos';

-- Restore public read access for profile photos (CDN-served)
DROP POLICY IF EXISTS "Authenticated users can view profile photos" ON storage.objects;
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');
