-- Add telephone and email columns to secondary_drivers table
ALTER TABLE public.secondary_drivers
ADD COLUMN telephone TEXT,
ADD COLUMN email TEXT;