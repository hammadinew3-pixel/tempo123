-- Add duree_deja_paye field to vehicules_traite table
ALTER TABLE public.vehicules_traite 
ADD COLUMN IF NOT EXISTS duree_deja_paye INTEGER DEFAULT 0;