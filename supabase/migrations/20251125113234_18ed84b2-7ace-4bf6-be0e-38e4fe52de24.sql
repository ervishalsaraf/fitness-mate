-- Create saved_locations table
CREATE TABLE public.saved_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  location_lat NUMERIC NOT NULL,
  location_lng NUMERIC NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own saved locations"
  ON public.saved_locations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved locations"
  ON public.saved_locations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved locations"
  ON public.saved_locations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved locations"
  ON public.saved_locations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_saved_locations_user_id ON public.saved_locations(user_id);

-- Create function to ensure only one default location per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.saved_locations
    SET is_default = false
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for single default location
CREATE TRIGGER ensure_single_default_location_trigger
  BEFORE INSERT OR UPDATE ON public.saved_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_location();