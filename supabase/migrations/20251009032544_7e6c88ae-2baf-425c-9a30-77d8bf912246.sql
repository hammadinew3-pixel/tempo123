-- Create trigger function for assistance to update vehicle status
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_assistance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When assistance is delivered (livre), mark vehicle as rented
  IF NEW.etat = 'livre' THEN
    UPDATE public.vehicles SET statut = 'loue' WHERE id = NEW.vehicle_id;
  
  -- When assistance is returned or closed, mark vehicle as available
  ELSIF NEW.etat IN ('retour_effectue', 'cloture') AND OLD.etat IN ('livre', 'contrat_valide') THEN
    UPDATE public.vehicles SET statut = 'disponible' WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_assistance_status_change ON public.assistance;

-- Create the trigger that will update vehicle status when assistance status changes
CREATE TRIGGER on_assistance_status_change
  BEFORE UPDATE ON public.assistance
  FOR EACH ROW
  WHEN (OLD.etat IS DISTINCT FROM NEW.etat)
  EXECUTE FUNCTION public.update_vehicle_status_on_assistance_change();