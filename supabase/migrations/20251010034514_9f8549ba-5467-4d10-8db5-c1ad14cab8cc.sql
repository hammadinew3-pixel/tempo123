-- Ajouter le statut "immobilise" à l'enum vehicle_status
ALTER TYPE vehicle_status ADD VALUE IF NOT EXISTS 'immobilise';

-- Fonction pour mettre à jour le statut du véhicule en fonction du sinistre
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_sinistre_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quand un sinistre est ouvert ou en cours, marquer le véhicule comme immobilisé
  IF NEW.statut IN ('ouvert', 'en_cours') AND NEW.vehicle_id IS NOT NULL THEN
    UPDATE public.vehicles 
    SET statut = 'immobilise'
    WHERE id = NEW.vehicle_id;
  
  -- Quand un sinistre est clos, remettre le véhicule comme disponible
  ELSIF NEW.statut = 'clos' AND OLD.statut IN ('ouvert', 'en_cours') AND NEW.vehicle_id IS NOT NULL THEN
    UPDATE public.vehicles 
    SET statut = 'disponible'
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table sinistres
DROP TRIGGER IF EXISTS trigger_update_vehicle_status_on_sinistre ON public.sinistres;
CREATE TRIGGER trigger_update_vehicle_status_on_sinistre
  AFTER INSERT OR UPDATE OF statut, vehicle_id
  ON public.sinistres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_status_on_sinistre_change();