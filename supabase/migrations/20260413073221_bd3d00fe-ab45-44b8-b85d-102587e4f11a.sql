
-- Founder fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS startup_name text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS startup_stage text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS funding_needed numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS short_pitch text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pitch_deck_url text DEFAULT '';

-- Investor fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_range_min numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS investment_range_max numeric DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_industries text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stage_preference text DEFAULT '';

-- Professional fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interested_roles text[] DEFAULT '{}';
