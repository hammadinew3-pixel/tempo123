-- Add franchise_montant column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN franchise_montant numeric DEFAULT 0;

-- Add franchise_montant column to assistance table
ALTER TABLE public.assistance 
ADD COLUMN franchise_montant numeric DEFAULT 0;

COMMENT ON COLUMN public.contracts.franchise_montant IS 'Montant de la franchise du contrat';
COMMENT ON COLUMN public.assistance.franchise_montant IS 'Montant de la franchise du dossier d''assistance';