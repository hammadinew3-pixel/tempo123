-- Phase 2: Simplifier la logique des modules
-- Supprimer les colonnes de modules inutiles (tous inclus par défaut sauf Assistance)
ALTER TABLE public.plans 
  DROP COLUMN IF EXISTS module_sinistres,
  DROP COLUMN IF EXISTS module_infractions,
  DROP COLUMN IF EXISTS module_alertes,
  DROP COLUMN IF EXISTS module_rapports;

-- Ajouter un commentaire explicatif
COMMENT ON COLUMN public.plans.module_assistance IS 
  'Module premium Assistance/Assurance. Tous les autres modules (Sinistres, Infractions, Alertes, Rapports) sont inclus par défaut dans tous les plans.';