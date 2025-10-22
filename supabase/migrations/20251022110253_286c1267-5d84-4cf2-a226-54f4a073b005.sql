-- Ajouter la colonne onboarding_completed à la table tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Marquer les tenants déjà actifs comme ayant complété l'onboarding
UPDATE public.tenants 
SET onboarding_completed = true 
WHERE is_active = true;