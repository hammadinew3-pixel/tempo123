-- Ajouter les colonnes manquantes à agence_settings
ALTER TABLE agence_settings 
ADD COLUMN IF NOT EXISTS raison_sociale text,
ADD COLUMN IF NOT EXISTS ice text,
ADD COLUMN IF NOT EXISTS if_number text,
ADD COLUMN IF NOT EXISTS rc text,
ADD COLUMN IF NOT EXISTS cnss text,
ADD COLUMN IF NOT EXISTS patente text,
ADD COLUMN IF NOT EXISTS signature_agence_url text,
ADD COLUMN IF NOT EXISTS taux_tva numeric DEFAULT 20,
ADD COLUMN IF NOT EXISTS alerte_cheque_jours integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS alerte_visite_jours integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS alerte_assurance_jours integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS alerte_autorisation_jours integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS masquer_logo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS masquer_entete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS masquer_pied_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inclure_cgv boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cgv_url text,
ADD COLUMN IF NOT EXISTS cgv_texte text;

-- Insérer une ligne par défaut si la table est vide
INSERT INTO agence_settings (
  raison_sociale,
  adresse,
  email,
  telephone,
  taux_tva,
  alerte_cheque_jours,
  alerte_visite_jours,
  alerte_assurance_jours,
  alerte_autorisation_jours,
  masquer_logo,
  masquer_entete,
  masquer_pied_page,
  inclure_cgv
)
SELECT 
  'Mon Agence',
  '',
  '',
  '',
  20,
  7,
  30,
  30,
  30,
  false,
  false,
  false,
  false
WHERE NOT EXISTS (SELECT 1 FROM agence_settings LIMIT 1);