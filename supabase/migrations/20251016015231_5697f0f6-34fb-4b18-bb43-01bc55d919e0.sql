-- Nettoyer les données incorrectes
TRUNCATE vehicle_affectations;

-- Fonction pour synchroniser les affectations lors de la création/modification d'un contrat
CREATE OR REPLACE FUNCTION sync_vehicle_affectations()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer les anciennes affectations du contrat
  DELETE FROM vehicle_affectations WHERE contract_id = NEW.id;
  
  -- Créer l'affectation initiale
  INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
  VALUES (
    NEW.id,
    NEW.vehicle_id,
    NEW.date_debut,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM vehicle_changes 
        WHERE contract_id = NEW.id 
        AND old_vehicle_id = NEW.vehicle_id
      )
      THEN (
        SELECT MIN(change_date) - INTERVAL '1 day'
        FROM vehicle_changes 
        WHERE contract_id = NEW.id 
        AND old_vehicle_id = NEW.vehicle_id
      )::date
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les affectations lors d'un changement de véhicule
CREATE OR REPLACE FUNCTION sync_vehicle_change_affectations()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour la date de fin de l'ancien véhicule
  UPDATE vehicle_affectations
  SET date_fin = NEW.change_date - INTERVAL '1 day'
  WHERE contract_id = NEW.contract_id
  AND vehicle_id = NEW.old_vehicle_id
  AND date_fin IS NULL;
  
  -- Créer l'affectation pour le nouveau véhicule
  INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
  VALUES (
    NEW.contract_id,
    NEW.new_vehicle_id,
    NEW.change_date,
    NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_sync_contract_affectations ON contracts;
CREATE TRIGGER trigger_sync_contract_affectations
  AFTER INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_affectations();

DROP TRIGGER IF EXISTS trigger_sync_vehicle_change ON vehicle_changes;
CREATE TRIGGER trigger_sync_vehicle_change
  AFTER INSERT ON vehicle_changes
  FOR EACH ROW
  EXECUTE FUNCTION sync_vehicle_change_affectations();

-- Migrer les données existantes
INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
SELECT 
  c.id as contract_id,
  c.vehicle_id,
  c.date_debut,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM vehicle_changes vc
      WHERE vc.contract_id = c.id 
      AND vc.old_vehicle_id = c.vehicle_id
    )
    THEN (
      SELECT MIN(change_date) - INTERVAL '1 day'
      FROM vehicle_changes vc
      WHERE vc.contract_id = c.id 
      AND vc.old_vehicle_id = c.vehicle_id
    )::date
    ELSE NULL
  END as date_fin
FROM contracts c
WHERE c.vehicle_id IS NOT NULL;

-- Migrer les changements de véhicule
INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
SELECT 
  vc1.contract_id,
  vc1.new_vehicle_id,
  vc1.change_date,
  (
    SELECT MIN(vc2.change_date) - INTERVAL '1 day'
    FROM vehicle_changes vc2
    WHERE vc2.contract_id = vc1.contract_id
    AND vc2.change_date > vc1.change_date
  )::date as date_fin
FROM vehicle_changes vc1
WHERE vc1.new_vehicle_id IS NOT NULL
ON CONFLICT DO NOTHING;