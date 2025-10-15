-- Add missing columns to contracts table for delivery and return tracking
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS delivery_type text,
ADD COLUMN IF NOT EXISTS delivery_date date,
ADD COLUMN IF NOT EXISTS delivery_km integer,
ADD COLUMN IF NOT EXISTS delivery_fuel_level text,
ADD COLUMN IF NOT EXISTS delivery_notes text,
ADD COLUMN IF NOT EXISTS return_type text,
ADD COLUMN IF NOT EXISTS return_date date,
ADD COLUMN IF NOT EXISTS return_km integer,
ADD COLUMN IF NOT EXISTS return_fuel_level text,
ADD COLUMN IF NOT EXISTS return_notes text,
ADD COLUMN IF NOT EXISTS daily_rate numeric,
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS prolongations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS caution_notes text;

COMMENT ON COLUMN public.contracts.delivery_type IS 'Type de livraison du véhicule';
COMMENT ON COLUMN public.contracts.delivery_date IS 'Date de livraison du véhicule';
COMMENT ON COLUMN public.contracts.delivery_km IS 'Kilométrage à la livraison';
COMMENT ON COLUMN public.contracts.delivery_fuel_level IS 'Niveau de carburant à la livraison';
COMMENT ON COLUMN public.contracts.delivery_notes IS 'Notes sur la livraison';
COMMENT ON COLUMN public.contracts.return_type IS 'Type de retour du véhicule';
COMMENT ON COLUMN public.contracts.return_date IS 'Date de retour du véhicule';
COMMENT ON COLUMN public.contracts.return_km IS 'Kilométrage au retour';
COMMENT ON COLUMN public.contracts.return_fuel_level IS 'Niveau de carburant au retour';
COMMENT ON COLUMN public.contracts.return_notes IS 'Notes sur le retour';
COMMENT ON COLUMN public.contracts.daily_rate IS 'Tarif journalier de la location';
COMMENT ON COLUMN public.contracts.duration IS 'Durée de la location en jours';
COMMENT ON COLUMN public.contracts.prolongations IS 'Historique des prolongations du contrat (JSON array)';
COMMENT ON COLUMN public.contracts.caution_notes IS 'Notes concernant la caution';