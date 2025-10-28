-- Add group_id to referrals table to track event invites shared with referrals
ALTER TABLE public.referrals 
ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_referrals_group_id ON public.referrals(group_id);