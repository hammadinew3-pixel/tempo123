-- Nettoyer et reconstruire correctement
TRUNCATE vehicle_affectations;

-- Pour le contrat CTR-1760577062572, créer les bonnes affectations
-- 1. Toyota du 16/10 au 19/10
INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
VALUES (
  'b0abb80a-5df6-4b0f-9adf-dcc6d8b363f0',
  '0f456aba-191c-47b6-8e12-0c1f465252bf', -- Toyota
  '2025-10-16',
  '2025-10-19' -- Un jour avant le changement
);

-- 2. Audi du 20/10 à la fin du contrat
INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
VALUES (
  'b0abb80a-5df6-4b0f-9adf-dcc6d8b363f0',
  '12a67f54-8b8e-489a-a5da-07d2fe786d43', -- Audi
  '2025-10-20',
  NULL -- Toujours actif
);

-- Migrer tous les autres contrats sans changement de véhicule
INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
SELECT 
  c.id,
  c.vehicle_id,
  c.date_debut,
  NULL
FROM contracts c
WHERE c.vehicle_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM vehicle_changes vc WHERE vc.contract_id = c.id
)
AND c.id != 'b0abb80a-5df6-4b0f-9adf-dcc6d8b363f0'; -- Exclure celui déjà traité