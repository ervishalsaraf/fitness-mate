-- Fix profile privacy: Only allow users to view their own profile and accepted buddy profiles

-- Drop the insecure public policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can view profiles of accepted buddies only
CREATE POLICY "Users can view accepted buddy profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.buddy_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND receiver_id = profiles.id) OR
      (receiver_id = auth.uid() AND requester_id = profiles.id)
    )
  )
);

-- Fix activity preferences privacy
DROP POLICY IF EXISTS "Activity preferences are viewable by everyone" ON public.activity_preferences;

CREATE POLICY "Users can view own activity preferences" 
ON public.activity_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view accepted buddy activity preferences" 
ON public.activity_preferences FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.buddy_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND receiver_id = user_id) OR
      (receiver_id = auth.uid() AND requester_id = user_id)
    )
  )
);

-- Fix time preferences privacy
DROP POLICY IF EXISTS "Time preferences are viewable by everyone" ON public.time_preferences;

CREATE POLICY "Users can view own time preferences" 
ON public.time_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view accepted buddy time preferences" 
ON public.time_preferences FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.buddy_connections
    WHERE status = 'accepted'
    AND (
      (requester_id = auth.uid() AND receiver_id = user_id) OR
      (receiver_id = auth.uid() AND requester_id = user_id)
    )
  )
);