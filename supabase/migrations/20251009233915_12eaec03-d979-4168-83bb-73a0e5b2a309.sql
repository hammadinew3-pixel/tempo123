-- Fonction pour mettre à jour le kilométrage du véhicule lors du retour d'un contrat
CREATE OR REPLACE FUNCTION public.update_vehicle_kilometrage_on_contract_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quand un contrat est retourné avec un kilométrage de retour
  IF NEW.return_km IS NOT NULL AND OLD.return_km IS NULL THEN
    UPDATE public.vehicles 
    SET kilometrage = NEW.return_km,
        updated_at = now()
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fonction pour mettre à jour le kilométrage du véhicule lors du retour d'une assistance
CREATE OR REPLACE FUNCTION public.update_vehicle_kilometrage_on_assistance_return()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quand une assistance est retournée avec un kilométrage de retour
  IF NEW.kilometrage_retour IS NOT NULL AND OLD.kilometrage_retour IS NULL THEN
    UPDATE public.vehicles 
    SET kilometrage = NEW.kilometrage_retour,
        updated_at = now()
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Trigger pour les contrats
DROP TRIGGER IF EXISTS trigger_update_vehicle_kilometrage_on_contract_return ON public.contracts;
CREATE TRIGGER trigger_update_vehicle_kilometrage_on_contract_return
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_kilometrage_on_contract_return();

-- Trigger pour les assistances
DROP TRIGGER IF EXISTS trigger_update_vehicle_kilometrage_on_assistance_return ON public.assistance;
CREATE TRIGGER trigger_update_vehicle_kilometrage_on_assistance_return
  AFTER UPDATE ON public.assistance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vehicle_kilometrage_on_assistance_return();