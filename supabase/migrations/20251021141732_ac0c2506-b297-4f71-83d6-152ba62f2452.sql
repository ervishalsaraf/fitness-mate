-- Add visibility enum type
CREATE TYPE public.event_visibility AS ENUM ('public', 'private');

-- Add columns to groups table for event visibility and invite codes
ALTER TABLE public.groups 
ADD COLUMN visibility public.event_visibility NOT NULL DEFAULT 'public',
ADD COLUMN invite_code text UNIQUE;

-- Create function to generate random invite codes
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    -- Generate 8 character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = code) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Create table to track group invites/joins via invite link
CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS on group_invites
ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view invites they're part of
CREATE POLICY "Users can view their own group invites"
ON public.group_invites FOR SELECT
USING (auth.uid() = user_id);

-- RLS policy: Users can create invite records (when joining via link)
CREATE POLICY "Users can join groups via invite"
ON public.group_invites FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update groups RLS policies to handle visibility
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;

-- Public groups are viewable by everyone
CREATE POLICY "Public groups are viewable by everyone"
ON public.groups FOR SELECT
USING (visibility = 'public');

-- Private groups are viewable by creator
CREATE POLICY "Group creators can view their private groups"
ON public.groups FOR SELECT
USING (auth.uid() = creator_id AND visibility = 'private');

-- Private groups are viewable by invited members
CREATE POLICY "Invited users can view private groups"
ON public.groups FOR SELECT
USING (
  visibility = 'private' AND 
  EXISTS (
    SELECT 1 FROM public.group_invites
    WHERE group_id = groups.id
    AND user_id = auth.uid()
  )
);

-- Add trigger to auto-generate invite code for private groups
CREATE OR REPLACE FUNCTION public.set_invite_code_for_private_group()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.visibility = 'private' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invite_code_trigger
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_invite_code_for_private_group();