-- Add missing fields to contracts table
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS duration integer,
ADD COLUMN IF NOT EXISTS daily_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance_payment numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS start_location text,
ADD COLUMN IF NOT EXISTS end_location text,
ADD COLUMN IF NOT EXISTS start_time time,
ADD COLUMN IF NOT EXISTS end_time time,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS client_signature text,
ADD COLUMN IF NOT EXISTS witness_signature text,
ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS branch_id integer,
ADD COLUMN IF NOT EXISTS pickup_branch_id integer,
ADD COLUMN IF NOT EXISTS dropoff_branch_id integer;

-- Create function to automatically calculate contract fields
CREATE OR REPLACE FUNCTION public.calculate_contract_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Calculate duration in days
  NEW.duration := (NEW.date_fin - NEW.date_debut);
  
  -- Get daily rate from vehicle if not set
  IF NEW.daily_rate IS NULL OR NEW.daily_rate = 0 THEN
    SELECT tarif_journalier INTO NEW.daily_rate
    FROM public.vehicles
    WHERE id = NEW.vehicle_id;
  END IF;
  
  -- Calculate total amount
  NEW.total_amount := NEW.duration * NEW.daily_rate;
  
  -- Calculate remaining amount
  IF NEW.advance_payment IS NULL THEN
    NEW.advance_payment := 0;
  END IF;
  NEW.remaining_amount := NEW.total_amount - NEW.advance_payment;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic calculations on insert and update
DROP TRIGGER IF EXISTS calculate_contract_fields_trigger ON public.contracts;
CREATE TRIGGER calculate_contract_fields_trigger
  BEFORE INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_contract_fields();