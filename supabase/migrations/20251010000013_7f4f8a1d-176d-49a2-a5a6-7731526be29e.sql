-- Add sous_location and en_service fields to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS sous_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS en_service boolean DEFAULT true;