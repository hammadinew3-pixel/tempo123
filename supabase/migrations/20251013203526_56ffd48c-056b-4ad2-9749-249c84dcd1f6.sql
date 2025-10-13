-- Ajouter une colonne pour stocker le texte des CGV
ALTER TABLE public.agence_settings 
ADD COLUMN IF NOT EXISTS cgv_texte TEXT;