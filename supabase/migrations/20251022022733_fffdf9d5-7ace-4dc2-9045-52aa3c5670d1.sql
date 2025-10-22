-- Corriger le trigger sync_vehicle_affectations pour inclure tenant_id
CREATE OR REPLACE FUNCTION public.sync_vehicle_affectations()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM vehicle_affectations WHERE contract_id = NEW.id;
  
  INSERT INTO vehicle_affectations (contract_id, vehicle_id, date_debut, date_fin, tenant_id)
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
    END,
    NEW.tenant_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Maintenant, appliquer la migration de correction des jours
-- Étape 1 : Recalculer duration pour tous les contrats avec la nouvelle formule
UPDATE contracts
SET duration = FLOOR(EXTRACT(EPOCH FROM (date_fin::timestamp - date_debut::timestamp)) / 86400)
WHERE date_debut IS NOT NULL AND date_fin IS NOT NULL;

-- Étape 2 : Récupérer daily_rate depuis le véhicule si NULL ou 0
UPDATE contracts c
SET daily_rate = v.tarif_journalier
FROM vehicles v
WHERE c.vehicle_id = v.id
  AND (c.daily_rate IS NULL OR c.daily_rate = 0)
  AND v.tarif_journalier IS NOT NULL
  AND v.tarif_journalier > 0;

-- Étape 3 : Recalculer total_amount basé sur duration et daily_rate
UPDATE contracts
SET total_amount = duration * COALESCE(daily_rate, 0)
WHERE duration IS NOT NULL
  AND daily_rate IS NOT NULL
  AND daily_rate > 0;

-- Étape 4 : Recalculer remaining_amount
UPDATE contracts
SET remaining_amount = GREATEST(0, COALESCE(total_amount, 0) - COALESCE(advance_payment, 0))
WHERE total_amount IS NOT NULL;

-- Étape 5 : Créer une fonction pour calculer automatiquement les montants
CREATE OR REPLACE FUNCTION auto_calculate_contract_amounts()
RETURNS TRIGGER AS $$
DECLARE
  vehicle_rate NUMERIC;
BEGIN
  -- Calculer duration si NULL (nouvelle formule: du 22 au 23 = 1 jour)
  IF NEW.duration IS NULL AND NEW.date_debut IS NOT NULL AND NEW.date_fin IS NOT NULL THEN
    NEW.duration := FLOOR(EXTRACT(EPOCH FROM (NEW.date_fin::timestamp - NEW.date_debut::timestamp)) / 86400);
  END IF;

  -- Récupérer daily_rate du véhicule si NULL ou 0
  IF (NEW.daily_rate IS NULL OR NEW.daily_rate = 0) AND NEW.vehicle_id IS NOT NULL THEN
    SELECT tarif_journalier INTO vehicle_rate
    FROM vehicles
    WHERE id = NEW.vehicle_id;
    
    IF vehicle_rate IS NOT NULL AND vehicle_rate > 0 THEN
      NEW.daily_rate := vehicle_rate;
    END IF;
  END IF;

  -- Calculer total_amount si NULL ou 0
  IF (NEW.total_amount IS NULL OR NEW.total_amount = 0) AND NEW.duration IS NOT NULL AND NEW.daily_rate IS NOT NULL AND NEW.daily_rate > 0 THEN
    NEW.total_amount := NEW.duration * NEW.daily_rate;
  END IF;

  -- Calculer remaining_amount
  IF NEW.total_amount IS NOT NULL THEN
    NEW.remaining_amount := GREATEST(0, NEW.total_amount - COALESCE(NEW.advance_payment, 0));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Étape 6 : Créer le trigger pour appliquer automatiquement les calculs
DROP TRIGGER IF EXISTS before_contract_insert_or_update ON contracts;
CREATE TRIGGER before_contract_insert_or_update
BEFORE INSERT OR UPDATE ON contracts
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_contract_amounts();