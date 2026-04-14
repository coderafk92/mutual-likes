
-- Update handle_swipe to include rate limiting
CREATE OR REPLACE FUNCTION public.handle_swipe(p_swiped_id uuid, p_direction swipe_direction)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_match_id UUID;
  v_mutual BOOLEAN;
  v_recent_swipes INTEGER;
BEGIN
  -- Rate limiting: max 100 swipes per hour
  SELECT COUNT(*) INTO v_recent_swipes
  FROM public.swipes
  WHERE swiper_id = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';
  
  IF v_recent_swipes >= 100 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

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
