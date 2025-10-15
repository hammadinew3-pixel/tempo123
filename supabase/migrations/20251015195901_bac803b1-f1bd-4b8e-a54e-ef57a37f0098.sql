-- Add missing columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS date_derniere_vidange DATE;

-- Add missing columns to vehicle_vignette table
ALTER TABLE public.vehicle_vignette 
ADD COLUMN IF NOT EXISTS date_paiement DATE;

-- Add missing columns to vehicules_traite table  
ALTER TABLE public.vehicules_traite 
ADD COLUMN IF NOT EXISTS organisme TEXT;