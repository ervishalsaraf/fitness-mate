-- Add is_public field to profiles table
ALTER TABLE public.profiles
ADD COLUMN is_public boolean DEFAULT false;

-- Update RLS policy to allow viewing public profiles or profiles with buddy connections
DROP POLICY IF EXISTS "Users can view accepted buddy profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can view accepted buddy profiles
CREATE POLICY "Users can view accepted buddy profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM buddy_connections
    WHERE buddy_connections.status = 'accepted'
    AND (
      (buddy_connections.requester_id = auth.uid() AND buddy_connections.receiver_id = profiles.id)
      OR (buddy_connections.receiver_id = auth.uid() AND buddy_connections.requester_id = profiles.id)
    )
  )
);

-- Policy: Users can view public profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (is_public = true);

-- Policy: Users can view profiles of users who sent them buddy requests
CREATE POLICY "Users can view profiles who sent buddy requests"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM buddy_connections
    WHERE buddy_connections.receiver_id = auth.uid()
    AND buddy_connections.requester_id = profiles.id
  )
);