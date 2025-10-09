-- Update the trigger function to handle new contract statuses
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_contract_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When contract is delivered (livre), mark vehicle as rented
  IF NEW.statut = 'livre' THEN
    UPDATE public.vehicles SET statut = 'loue' WHERE id = NEW.vehicle_id;
  
  -- When contract is returned or closed (retour_effectue or termine), mark vehicle as available
  ELSIF NEW.statut IN ('retour_effectue', 'termine', 'annule') AND OLD.statut IN ('livre', 'contrat_valide') THEN
    UPDATE public.vehicles SET statut = 'disponible' WHERE id = NEW.vehicle_id;
    
    -- If contract is finished, mark caution as returned
    IF NEW.statut = 'termine' THEN
      NEW.caution_statut := 'remboursee';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;