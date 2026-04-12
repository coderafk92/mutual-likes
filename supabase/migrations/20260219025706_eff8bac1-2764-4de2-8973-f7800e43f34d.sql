-- Update the handle_new_user function to support both phone and email signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, COALESCE(NEW.email, '')),
    ''
  );
  RETURN NEW;
END;
$$;

-- Make phone_number nullable or allow empty for email users
ALTER TABLE public.profiles ALTER COLUMN phone_number SET DEFAULT '';
