-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_contract_status_change ON public.contracts;

-- Create the trigger that will update vehicle status when contract status changes
CREATE TRIGGER on_contract_status_change
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION public.update_vehicle_status_on_contract_change();