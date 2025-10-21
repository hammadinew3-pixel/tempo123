-- Add carburant column to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS carburant text;