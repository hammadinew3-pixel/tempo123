-- Add missing columns to infractions table
ALTER TABLE public.infractions
ADD COLUMN IF NOT EXISTS reference text,
ADD COLUMN IF NOT EXISTS client_id uuid;

COMMENT ON COLUMN public.infractions.reference IS 'Référence unique de l''infraction (ex: INF-25-0001)';
COMMENT ON COLUMN public.infractions.client_id IS 'Référence au client concerné par l''infraction';

-- Add missing columns to vehicle_insurance table
ALTER TABLE public.vehicle_insurance
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.vehicle_insurance.photo_url IS 'URL de la photo/document d''assurance';
COMMENT ON COLUMN public.vehicle_insurance.remarques IS 'Remarques additionnelles sur l''assurance';

-- Add missing columns to vehicle_technical_inspection table
ALTER TABLE public.vehicle_technical_inspection
ADD COLUMN IF NOT EXISTS resultat text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.vehicle_technical_inspection.resultat IS 'Résultat de la visite technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.photo_url IS 'URL de la photo/document de visite technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.remarques IS 'Remarques additionnelles sur la visite technique';

-- Add missing columns to vehicle_vignette table
ALTER TABLE public.vehicle_vignette
ADD COLUMN IF NOT EXISTS annee integer,
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.vehicle_vignette.annee IS 'Année de la vignette';
COMMENT ON COLUMN public.vehicle_vignette.remarques IS 'Remarques additionnelles sur la vignette';