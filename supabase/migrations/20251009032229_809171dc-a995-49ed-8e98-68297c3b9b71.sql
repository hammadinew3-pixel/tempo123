-- Add new contract statuses for the workflow
-- Current statuses: brouillon, actif, termine, annule
-- New workflow: brouillon (réservation) -> contrat_valide -> livre (en cours) -> retour_effectue -> termine (clôture)

-- Drop the existing constraint
ALTER TABLE public.contracts 
  DROP CONSTRAINT IF EXISTS contracts_statut_check;

-- Update the contract_status enum to include new statuses
-- We need to use ALTER TYPE to add new values
DO $$ 
BEGIN
  -- Add new status values if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'contract_status' AND e.enumlabel = 'contrat_valide') THEN
    ALTER TYPE contract_status ADD VALUE 'contrat_valide';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'contract_status' AND e.enumlabel = 'livre') THEN
    ALTER TYPE contract_status ADD VALUE 'livre';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'contract_status' AND e.enumlabel = 'retour_effectue') THEN
    ALTER TYPE contract_status ADD VALUE 'retour_effectue';
  END IF;
END $$;

COMMENT ON TYPE contract_status IS 'Workflow: brouillon (réservation) -> contrat_valide (contrat finalisé) -> livre (en cours/livré) -> retour_effectue (véhicule retourné) -> termine (clôture)';

-- Do the same for assistance_status to keep consistency
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'assistance_status' AND e.enumlabel = 'contrat_valide') THEN
    ALTER TYPE assistance_status ADD VALUE 'contrat_valide';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'assistance_status' AND e.enumlabel = 'livre') THEN
    ALTER TYPE assistance_status ADD VALUE 'livre';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'assistance_status' AND e.enumlabel = 'retour_effectue') THEN
    ALTER TYPE assistance_status ADD VALUE 'retour_effectue';
  END IF;
END $$;