
-- Create a secure view that excludes sensitive columns
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id, name, age, gender, bio, photos, role, verified,
  startup_name, industry, startup_stage, funding_needed, short_pitch, pitch_deck_url,
  investment_range_min, investment_range_max, preferred_industries, stage_preference,
  skills, experience, interested_roles, status, created_at
FROM public.profiles
WHERE status = 'active';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Update profiles SELECT policy: only owner can read full profile
DROP POLICY IF EXISTS "Users can read active profiles" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Restrict storage: only authenticated users can view profile photos
DROP POLICY IF EXISTS "Anyone can view profile photos" ON storage.objects;
CREATE POLICY "Authenticated users can view profile photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-photos');

-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'profile-photos';
