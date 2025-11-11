-- Update the handle_new_user function to give new users 30-day premium trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    referral_code,
    subscription_tier,
    subscription_status,
    subscription_end
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    LOWER(SUBSTRING(MD5(RANDOM()::TEXT || NEW.id::TEXT) FROM 1 FOR 8)),
    'premium',
    'trial',
    NOW() + INTERVAL '30 days'
  );
  
  RETURN NEW;
END;
$$;