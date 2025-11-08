-- Add subscription fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'elite')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

-- Create table to track daily message limits for free tier users
CREATE TABLE IF NOT EXISTS public.user_message_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  message_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS on user_message_limits
ALTER TABLE public.user_message_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_message_limits
CREATE POLICY "Users can view their own message limits"
ON public.user_message_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own message limits"
ON public.user_message_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own message limits"
ON public.user_message_limits
FOR UPDATE
USING (auth.uid() = user_id);

-- Create table to track event participation limits for free tier users
CREATE TABLE IF NOT EXISTS public.user_event_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS on user_event_limits
ALTER TABLE public.user_event_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_event_limits
CREATE POLICY "Users can view their own event limits"
ON public.user_event_limits
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own event limits"
ON public.user_event_limits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own event limits"
ON public.user_event_limits
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_message_limits_user_date ON public.user_message_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_event_limits_user ON public.user_event_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);