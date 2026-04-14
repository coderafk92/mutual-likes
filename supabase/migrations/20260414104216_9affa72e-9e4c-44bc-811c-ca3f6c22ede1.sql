
-- Drop the view (won't work with restricted RLS + SECURITY INVOKER)
DROP VIEW IF EXISTS public.public_profiles;

-- Create a secure function to get discoverable profiles (excludes sensitive fields)
CREATE OR REPLACE FUNCTION public.get_public_profile(_profile_id uuid)
RETURNS TABLE(
  id uuid, name text, age integer, gender text, bio text, photos jsonb,
  role text, verified boolean, startup_name text, industry text, startup_stage text,
  funding_needed numeric, short_pitch text, pitch_deck_url text,
  investment_range_min numeric, investment_range_max numeric,
  preferred_industries text[], stage_preference text,
  skills text[], experience text, interested_roles text[],
  status profile_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.age, p.gender, p.bio, p.photos,
    p.role, p.verified, p.startup_name, p.industry, p.startup_stage,
    p.funding_needed, p.short_pitch, p.pitch_deck_url,
    p.investment_range_min, p.investment_range_max,
    p.preferred_industries, p.stage_preference,
    p.skills, p.experience, p.interested_roles,
    p.status
  FROM public.profiles p
  WHERE p.id = _profile_id AND p.status = 'active';
$$;

-- Create function to get discoverable profiles
CREATE OR REPLACE FUNCTION public.get_discoverable_profiles(_exclude_ids uuid[])
RETURNS TABLE(
  id uuid, name text, age integer, gender text, bio text, photos jsonb,
  role text, verified boolean, startup_name text, industry text, startup_stage text,
  funding_needed numeric, short_pitch text, pitch_deck_url text,
  investment_range_min numeric, investment_range_max numeric,
  preferred_industries text[], stage_preference text,
  skills text[], experience text, interested_roles text[],
  status profile_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.age, p.gender, p.bio, p.photos,
    p.role, p.verified, p.startup_name, p.industry, p.startup_stage,
    p.funding_needed, p.short_pitch, p.pitch_deck_url,
    p.investment_range_min, p.investment_range_max,
    p.preferred_industries, p.stage_preference,
    p.skills, p.experience, p.interested_roles,
    p.status
  FROM public.profiles p
  WHERE p.status = 'active'
    AND p.name != ''
    AND NOT (p.id = ANY(_exclude_ids))
  LIMIT 20;
$$;
