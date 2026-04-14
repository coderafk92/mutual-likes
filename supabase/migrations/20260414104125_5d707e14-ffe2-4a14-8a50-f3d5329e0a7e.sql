
-- Recreate view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles WITH (security_invoker = true) AS
SELECT 
  id, name, age, gender, bio, photos, role, verified,
  startup_name, industry, startup_stage, funding_needed, short_pitch, pitch_deck_url,
  investment_range_min, investment_range_max, preferred_industries, stage_preference,
  skills, experience, interested_roles, status, created_at
FROM public.profiles
WHERE status = 'active';

GRANT SELECT ON public.public_profiles TO authenticated;
