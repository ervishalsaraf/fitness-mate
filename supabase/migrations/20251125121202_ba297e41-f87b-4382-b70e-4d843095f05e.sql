-- Add nickname column to saved_locations table
ALTER TABLE public.saved_locations
ADD COLUMN nickname text;