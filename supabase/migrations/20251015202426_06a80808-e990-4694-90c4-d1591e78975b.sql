-- Add missing columns to vehicle_insurance table
ALTER TABLE public.vehicle_insurance
ADD COLUMN IF NOT EXISTS numero_ordre text,
ADD COLUMN IF NOT EXISTS coordonnees_assureur text,
ADD COLUMN IF NOT EXISTS date_paiement date,
ADD COLUMN IF NOT EXISTS mode_paiement text,
ADD COLUMN IF NOT EXISTS numero_cheque text,
ADD COLUMN IF NOT EXISTS banque text,
ADD COLUMN IF NOT EXISTS remarques text,
ADD COLUMN IF NOT EXISTS photo_url text;

-- Add missing columns to vehicle_technical_inspection table
ALTER TABLE public.vehicle_technical_inspection
ADD COLUMN IF NOT EXISTS numero_ordre text,
ADD COLUMN IF NOT EXISTS centre_controle text,
ADD COLUMN IF NOT EXISTS date_paiement date,
ADD COLUMN IF NOT EXISTS mode_paiement text,
ADD COLUMN IF NOT EXISTS numero_cheque text,
ADD COLUMN IF NOT EXISTS banque text,
ADD COLUMN IF NOT EXISTS remarques text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS montant numeric;

-- Add missing columns to vehicle_vignette table
ALTER TABLE public.vehicle_vignette
ADD COLUMN IF NOT EXISTS numero_ordre text,
ADD COLUMN IF NOT EXISTS annee integer,
ADD COLUMN IF NOT EXISTS mode_paiement text,
ADD COLUMN IF NOT EXISTS numero_cheque text,
ADD COLUMN IF NOT EXISTS banque text,
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.vehicle_insurance.numero_ordre IS 'Numéro d''ordre du document d''assurance';
COMMENT ON COLUMN public.vehicle_insurance.coordonnees_assureur IS 'Coordonnées de contact de l''assureur';
COMMENT ON COLUMN public.vehicle_insurance.date_paiement IS 'Date de paiement de la prime d''assurance';
COMMENT ON COLUMN public.vehicle_insurance.mode_paiement IS 'Mode de paiement: especes, cheque, virement, carte';
COMMENT ON COLUMN public.vehicle_insurance.numero_cheque IS 'Numéro du chèque si paiement par chèque';
COMMENT ON COLUMN public.vehicle_insurance.banque IS 'Nom de la banque pour le paiement par chèque';
COMMENT ON COLUMN public.vehicle_insurance.remarques IS 'Remarques ou notes supplémentaires';
COMMENT ON COLUMN public.vehicle_insurance.photo_url IS 'URL de la photo/scan du document d''assurance';

COMMENT ON COLUMN public.vehicle_technical_inspection.numero_ordre IS 'Numéro d''ordre du document de visite technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.centre_controle IS 'Centre de contrôle technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.date_paiement IS 'Date de paiement de la visite technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.mode_paiement IS 'Mode de paiement: especes, cheque, virement, carte';
COMMENT ON COLUMN public.vehicle_technical_inspection.numero_cheque IS 'Numéro du chèque si paiement par chèque';
COMMENT ON COLUMN public.vehicle_technical_inspection.banque IS 'Nom de la banque pour le paiement par chèque';
COMMENT ON COLUMN public.vehicle_technical_inspection.remarques IS 'Remarques ou notes supplémentaires';
COMMENT ON COLUMN public.vehicle_technical_inspection.photo_url IS 'URL de la photo/scan du document de visite technique';
COMMENT ON COLUMN public.vehicle_technical_inspection.montant IS 'Montant de la visite technique';

COMMENT ON COLUMN public.vehicle_vignette.numero_ordre IS 'Numéro d''ordre du document de vignette';
COMMENT ON COLUMN public.vehicle_vignette.annee IS 'Année de la vignette';
COMMENT ON COLUMN public.vehicle_vignette.mode_paiement IS 'Mode de paiement: especes, cheque, virement, carte';
COMMENT ON COLUMN public.vehicle_vignette.numero_cheque IS 'Numéro du chèque si paiement par chèque';
COMMENT ON COLUMN public.vehicle_vignette.banque IS 'Nom de la banque pour le paiement par chèque';
COMMENT ON COLUMN public.vehicle_vignette.remarques IS 'Remarques ou notes supplémentaires';