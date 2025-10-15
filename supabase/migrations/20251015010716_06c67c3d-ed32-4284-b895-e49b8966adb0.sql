-- Ajouter le champ pour la signature/cachet de l'agence dans les paramètres
ALTER TABLE public.agence_settings 
ADD COLUMN signature_agence_url text;