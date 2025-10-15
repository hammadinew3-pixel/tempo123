-- Add missing columns to vehicules_traite table
ALTER TABLE public.vehicules_traite
ADD COLUMN IF NOT EXISTS concessionaire text,
ADD COLUMN IF NOT EXISTS date_achat date;

COMMENT ON COLUMN public.vehicules_traite.concessionaire IS 'Nom du concessionaire ou maison d''achat';
COMMENT ON COLUMN public.vehicules_traite.date_achat IS 'Date d''achat du véhicule';