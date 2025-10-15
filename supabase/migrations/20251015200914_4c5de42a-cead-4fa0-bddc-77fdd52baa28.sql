-- Add missing traite_id column to vehicules_traites_echeances
ALTER TABLE public.vehicules_traites_echeances
ADD COLUMN IF NOT EXISTS traite_id uuid REFERENCES public.vehicules_traite(id) ON DELETE CASCADE;

-- Add missing statut column to vehicules_traites_echeances
ALTER TABLE public.vehicules_traites_echeances
ADD COLUMN IF NOT EXISTS statut text DEFAULT 'À payer';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_vehicules_traites_echeances_traite_id 
ON public.vehicules_traites_echeances(traite_id);

-- Add missing columns to vehicules_traite table
ALTER TABLE public.vehicules_traite
ADD COLUMN IF NOT EXISTS date_debut date,
ADD COLUMN IF NOT EXISTS nombre_traites integer,
ADD COLUMN IF NOT EXISTS montant_mensuel numeric,
ADD COLUMN IF NOT EXISTS montant_total numeric,
ADD COLUMN IF NOT EXISTS avance_paye numeric,
ADD COLUMN IF NOT EXISTS duree_deja_paye integer,
ADD COLUMN IF NOT EXISTS notes text;