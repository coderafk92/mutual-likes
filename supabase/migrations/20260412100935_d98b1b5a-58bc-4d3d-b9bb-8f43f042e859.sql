
-- Add role and verified columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false;

-- Update DM policies to allow anyone to message anyone
DROP POLICY IF EXISTS "Users can read own DMs" ON public.direct_messages;
CREATE POLICY "Users can read own DMs" ON public.direct_messages
FOR SELECT USING ((sender_id = auth.uid()) OR (receiver_id = auth.uid()));

DROP POLICY IF EXISTS "Users can send DMs" ON public.direct_messages;
CREATE POLICY "Users can send DMs" ON public.direct_messages
FOR INSERT WITH CHECK (sender_id = auth.uid() AND is_profile_active(auth.uid()));
