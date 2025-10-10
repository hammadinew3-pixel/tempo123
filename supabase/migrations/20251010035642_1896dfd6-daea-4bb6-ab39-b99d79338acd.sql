-- Ajouter le champ prolongations à la table contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS prolongations jsonb DEFAULT '[]'::jsonb;