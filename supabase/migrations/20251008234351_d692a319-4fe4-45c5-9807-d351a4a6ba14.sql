-- Fix security warnings: Add search_path to functions

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the calculate_invoice_ttc function
CREATE OR REPLACE FUNCTION public.calculate_invoice_ttc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.montant_ttc := NEW.montant_ht * (1 + NEW.taux_tva / 100);
  RETURN NEW;
END;
$$;

-- Update the update_vehicle_status_on_contract_change function
CREATE OR REPLACE FUNCTION public.update_vehicle_status_on_contract_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'loue' WHERE id = NEW.vehicle_id;
  ELSIF NEW.statut IN ('termine', 'annule') AND OLD.statut = 'actif' THEN
    UPDATE public.vehicles SET statut = 'disponible' WHERE id = NEW.vehicle_id;
    -- Also unlock caution if contract ended
    IF NEW.statut = 'termine' THEN
      NEW.caution_statut := 'remboursee';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;