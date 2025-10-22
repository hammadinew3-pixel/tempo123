-- Fonction pour mettre à jour automatiquement le statut du véhicule selon le contrat
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_contract_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quand un contrat est créé ou mis à jour
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Si le contrat est en brouillon (réservation), marquer le véhicule comme réservé
    IF NEW.statut = 'brouillon' THEN
      UPDATE vehicles
      SET statut = 'reserve'::vehicle_status
      WHERE id = NEW.vehicle_id;
    
    -- Si le contrat est livré (livraison effectuée), marquer le véhicule comme loué
    ELSIF NEW.statut IN ('livre', 'ouvert', 'contrat_valide') THEN
      UPDATE vehicles
      SET statut = 'loue'::vehicle_status
      WHERE id = NEW.vehicle_id;
    
    -- Si le contrat est clôturé ou terminé, marquer le véhicule comme disponible
    ELSIF NEW.statut IN ('cloture', 'termine', 'retour_effectue') THEN
      UPDATE vehicles
      SET statut = 'disponible'::vehicle_status
      WHERE id = NEW.vehicle_id;
    
    -- Si le contrat est annulé, remettre le véhicule à disponible
    ELSIF NEW.statut = 'annule' THEN
      UPDATE vehicles
      SET statut = 'disponible'::vehicle_status
      WHERE id = NEW.vehicle_id;
    END IF;
  END IF;

  -- Quand un contrat est supprimé, remettre le véhicule à disponible
  IF (TG_OP = 'DELETE') THEN
    UPDATE vehicles
    SET statut = 'disponible'::vehicle_status
    WHERE id = OLD.vehicle_id
    AND statut IN ('reserve', 'loue'); -- Seulement si le véhicule était réservé ou loué
    
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS trigger_update_vehicle_status_on_contract ON contracts;

-- Créer le trigger sur la table contracts
CREATE TRIGGER trigger_update_vehicle_status_on_contract
AFTER INSERT OR UPDATE OR DELETE ON contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_vehicle_status_on_contract_change();

-- Mettre à jour tous les véhicules existants selon leurs contrats actifs
UPDATE vehicles v
SET statut = CASE
  WHEN EXISTS (
    SELECT 1 FROM contracts c 
    WHERE c.vehicle_id = v.id 
    AND c.statut IN ('livre', 'ouvert', 'contrat_valide')
    LIMIT 1
  ) THEN 'loue'::vehicle_status
  WHEN EXISTS (
    SELECT 1 FROM contracts c 
    WHERE c.vehicle_id = v.id 
    AND c.statut = 'brouillon'
    LIMIT 1
  ) THEN 'reserve'::vehicle_status
  ELSE 'disponible'::vehicle_status
END
WHERE v.en_service = true;