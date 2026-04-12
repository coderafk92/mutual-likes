
-- Create enums
CREATE TYPE public.profile_status AS ENUM ('active', 'pending_deletion');
CREATE TYPE public.swipe_direction AS ENUM ('left', 'right');
CREATE TYPE public.match_status AS ENUM ('active', 'inactive');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  age INTEGER,
  gender TEXT,
  bio TEXT DEFAULT '',
  photos JSONB DEFAULT '[]'::jsonb,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status profile_status NOT NULL DEFAULT 'active',
  deletion_request_date TIMESTAMPTZ,
  scheduled_deletion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Swipes table
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(swiper_id, swiped_id),
  CHECK(swiper_id <> swiped_id)
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status match_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK(user1_id <> user2_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(reporter_id <> reported_id)
);

-- Indexes
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_location ON public.profiles(latitude, longitude);
CREATE INDEX idx_swipes_swiper ON public.swipes(swiper_id);
CREATE INDEX idx_swipes_swiped ON public.swipes(swiped_id);
CREATE INDEX idx_swipes_pair ON public.swipes(swiper_id, swiped_id);
CREATE INDEX idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX idx_messages_match ON public.messages(match_id, created_at);
CREATE INDEX idx_profiles_deletion ON public.profiles(scheduled_deletion_date) WHERE status = 'pending_deletion';

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.is_profile_active(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_match_participant(_user_id UUID, _match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches 
    WHERE id = _match_id AND (user1_id = _user_id OR user2_id = _user_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_match_active(_match_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.matches WHERE id = _match_id AND status = 'active'
  );
$$;

-- Profiles policies
CREATE POLICY "Users can read active profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'active' OR id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE TO authenticated
  USING (id = auth.uid());

-- Swipes policies
CREATE POLICY "Users can create swipes" ON public.swipes
  FOR INSERT TO authenticated
  WITH CHECK (
    swiper_id = auth.uid() 
    AND public.is_profile_active(auth.uid()) 
    AND public.is_profile_active(swiped_id)
  );

CREATE POLICY "Users can read own swipes" ON public.swipes
  FOR SELECT TO authenticated
  USING (swiper_id = auth.uid());

-- Matches policies
CREATE POLICY "Users can read own matches" ON public.matches
  FOR SELECT TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can insert matches" ON public.matches
  FOR INSERT TO authenticated
  WITH CHECK (
    (user1_id = auth.uid() OR user2_id = auth.uid())
    AND public.is_profile_active(user1_id)
    AND public.is_profile_active(user2_id)
  );

CREATE POLICY "Users can update own matches" ON public.matches
  FOR UPDATE TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

-- Messages policies
CREATE POLICY "Match participants can read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_match_participant(auth.uid(), match_id));

CREATE POLICY "Match participants can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_match_participant(auth.uid(), match_id)
    AND public.is_match_active(match_id)
    AND public.is_profile_active(auth.uid())
  );

-- Reports policies
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND public.is_profile_active(auth.uid())
  );

CREATE POLICY "No one reads reports via client" ON public.reports
  FOR SELECT TO authenticated
  USING (false);

-- Auto-create profile on signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, name)
  VALUES (NEW.id, COALESCE(NEW.phone, ''), '');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle swipe and auto-match
CREATE OR REPLACE FUNCTION public.handle_swipe(p_swiped_id UUID, p_direction swipe_direction)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match_id UUID;
  v_mutual BOOLEAN;
BEGIN
  -- Check active status
  IF NOT public.is_profile_active(auth.uid()) THEN
    RAISE EXCEPTION 'Your profile is not active';
  END IF;
  IF NOT public.is_profile_active(p_swiped_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  IF auth.uid() = p_swiped_id THEN
    RAISE EXCEPTION 'Cannot swipe on yourself';
  END IF;

  -- Insert swipe
  INSERT INTO public.swipes (swiper_id, swiped_id, direction)
  VALUES (auth.uid(), p_swiped_id, p_direction)
  ON CONFLICT (swiper_id, swiped_id) DO NOTHING;

  -- Check for mutual like
  IF p_direction = 'right' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = p_swiped_id AND swiped_id = auth.uid() AND direction = 'right'
    ) INTO v_mutual;

    IF v_mutual THEN
      -- Check no existing match
      IF NOT EXISTS (
        SELECT 1 FROM public.matches
        WHERE (user1_id = auth.uid() AND user2_id = p_swiped_id)
           OR (user1_id = p_swiped_id AND user2_id = auth.uid())
      ) THEN
        INSERT INTO public.matches (user1_id, user2_id)
        VALUES (LEAST(auth.uid(), p_swiped_id), GREATEST(auth.uid(), p_swiped_id))
        RETURNING id INTO v_match_id;
        
        RETURN jsonb_build_object('matched', true, 'match_id', v_match_id);
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object('matched', false);
END;
$$;
