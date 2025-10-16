-- Corriger les fonctions avec search_path sécurisé
CREATE OR REPLACE FUNCTION sync_vehicle_affectations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM vehicle_affectations WHERE contract_id = NEW.id;
  
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
$$;

CREATE OR REPLACE FUNCTION sync_vehicle_change_affectations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vehicle_affectations
  SET date_fin = NEW.change_date - INTERVAL '1 day'
  WHERE contract_id = NEW.contract_id
  AND vehicle_id = NEW.old_vehicle_id
  AND date_fin IS NULL;
  
  INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin)
  VALUES (
    NEW.contract_id,
    NEW.new_vehicle_id,
    NEW.change_date,
    NULL
  );
  
  RETURN NEW;
END;
$$;