-- Add admin RLS policies for viewing and managing all data

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all activity sessions
CREATE POLICY "Admins can view all activity sessions"
ON activity_sessions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all user message limits
CREATE POLICY "Admins can view all user message limits"
ON user_message_limits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all user event limits
CREATE POLICY "Admins can view all user event limits"
ON user_event_limits FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all buddy connections
CREATE POLICY "Admins can view all buddy connections"
ON buddy_connections FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all groups
CREATE POLICY "Admins can view all groups"
ON groups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));