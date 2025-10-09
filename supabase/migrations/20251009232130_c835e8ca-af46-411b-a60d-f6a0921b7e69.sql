-- Add prolongations field to assistance table to track contract extensions
ALTER TABLE public.assistance
ADD COLUMN prolongations JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.assistance.prolongations IS 'Historique des prolongations de contrat demandées par les assurances. Format: [{date, ancienne_date_fin, nouvelle_date_fin, raison}]';