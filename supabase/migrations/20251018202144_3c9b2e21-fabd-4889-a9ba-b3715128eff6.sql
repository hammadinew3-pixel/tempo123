-- Add prochain_kilometrage_vidange column to interventions table
ALTER TABLE interventions 
ADD COLUMN prochain_kilometrage_vidange INTEGER;

-- Update the sync_vidange_to_vehicle function to also sync prochain_kilometrage_vidange
CREATE OR REPLACE FUNCTION public.sync_vidange_to_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If intervention type is Vidange, update vehicle
  IF NEW.type_intervention = 'Vidange' THEN
    UPDATE vehicles
    SET 
      dernier_kilometrage_vidange = NEW.kilometrage_actuel,
      date_derniere_vidange = NEW.date_intervention,
      prochain_kilometrage_vidange = NEW.prochain_kilometrage_vidange,
      updated_at = now()
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$function$;