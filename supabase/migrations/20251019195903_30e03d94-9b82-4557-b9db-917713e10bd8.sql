-- Supprimer les colonnes devenues inutiles de super_admin_settings
ALTER TABLE public.super_admin_settings 
  DROP COLUMN IF EXISTS default_max_vehicles,
  DROP COLUMN IF EXISTS default_max_users,
  DROP COLUMN IF EXISTS trial_duration_days;

-- Ajouter un commentaire explicatif
COMMENT ON TABLE public.super_admin_settings IS 
  'Paramètres globaux de la plateforme. Les quotas par agence (véhicules, utilisateurs, durée d''essai) sont gérés via les plans assignés aux tenants.';