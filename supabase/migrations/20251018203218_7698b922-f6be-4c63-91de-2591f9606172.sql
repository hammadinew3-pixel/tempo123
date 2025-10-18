-- Add depense_id column to interventions table
ALTER TABLE interventions 
ADD COLUMN IF NOT EXISTS depense_id UUID REFERENCES expenses(id);

-- Create trigger to automatically create expense for interventions
CREATE OR REPLACE FUNCTION public.create_expense_for_intervention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_expense_id UUID;
BEGIN
  -- Create expense
  INSERT INTO expenses (
    vehicle_id,
    date_depense,
    montant,
    description,
    type_depense,
    categorie,
    statut,
    mode_paiement
  ) VALUES (
    NEW.vehicle_id,
    NEW.date_intervention,
    NEW.montant_ttc,
    'Dépense liée à une intervention : ' || NEW.type_intervention,
    'maintenance',
    NEW.type_intervention,
    'paye',
    'espece'
  ) RETURNING id INTO new_expense_id;
  
  -- Link expense to intervention
  NEW.depense_id = new_expense_id;
  
  RETURN NEW;
END;
$function$;

-- Attach trigger to interventions table
DROP TRIGGER IF EXISTS trigger_create_expense_for_intervention ON interventions;
CREATE TRIGGER trigger_create_expense_for_intervention
  BEFORE INSERT ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_for_intervention();

-- Attach trigger for vidange sync (already exists but ensure it's active)
DROP TRIGGER IF EXISTS trigger_sync_vidange_to_vehicle ON interventions;
CREATE TRIGGER trigger_sync_vidange_to_vehicle
  AFTER INSERT OR UPDATE ON interventions
  FOR EACH ROW
  EXECUTE FUNCTION sync_vidange_to_vehicle();