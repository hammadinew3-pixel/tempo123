-- Migration : Supprimer le champ ww après migration des données

-- Étape 1 : Migrer les données de ww vers immatriculation_provisoire
-- (seulement pour les véhicules qui ont ww mais pas immatriculation_provisoire)
UPDATE vehicles
SET immatriculation_provisoire = ww
WHERE ww IS NOT NULL 
  AND ww != ''
  AND (immatriculation_provisoire IS NULL OR immatriculation_provisoire = '');

-- Étape 2 : Supprimer la colonne ww
ALTER TABLE vehicles DROP COLUMN IF EXISTS ww;