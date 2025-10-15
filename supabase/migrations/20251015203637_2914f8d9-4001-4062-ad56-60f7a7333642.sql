-- Add missing columns to assistance table
ALTER TABLE public.assistance
ADD COLUMN IF NOT EXISTS kilometrage_retour integer,
ADD COLUMN IF NOT EXISTS niveau_carburant_depart text,
ADD COLUMN IF NOT EXISTS niveau_carburant_retour text,
ADD COLUMN IF NOT EXISTS etat_vehicule_depart text,
ADD COLUMN IF NOT EXISTS etat_vehicule_retour text,
ADD COLUMN IF NOT EXISTS franchise_notes text,
ADD COLUMN IF NOT EXISTS date_paiement_assurance date,
ADD COLUMN IF NOT EXISTS prolongations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.assistance.kilometrage_retour IS 'Kilométrage au retour du véhicule';
COMMENT ON COLUMN public.assistance.niveau_carburant_depart IS 'Niveau de carburant à la livraison';
COMMENT ON COLUMN public.assistance.niveau_carburant_retour IS 'Niveau de carburant au retour';
COMMENT ON COLUMN public.assistance.etat_vehicule_depart IS 'État du véhicule à la livraison';
COMMENT ON COLUMN public.assistance.etat_vehicule_retour IS 'État du véhicule au retour';
COMMENT ON COLUMN public.assistance.franchise_notes IS 'Notes concernant la franchise';
COMMENT ON COLUMN public.assistance.date_paiement_assurance IS 'Date de paiement par l''assurance';
COMMENT ON COLUMN public.assistance.prolongations IS 'Historique des prolongations (JSON array)';
COMMENT ON COLUMN public.assistance.remarques IS 'Remarques additionnelles sur le dossier d''assistance';