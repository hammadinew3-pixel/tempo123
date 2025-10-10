-- Add prochain_kilometrage_vidange field to vehicles table
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS prochain_kilometrage_vidange integer DEFAULT NULL;