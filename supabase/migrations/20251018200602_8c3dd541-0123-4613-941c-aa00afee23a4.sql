-- Create interventions table
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  depense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  date_intervention DATE NOT NULL,
  kilometrage_actuel INTEGER NOT NULL,
  type_intervention TEXT NOT NULL,
  details_intervention TEXT[],
  garage_externe BOOLEAN DEFAULT false,
  nom_garage TEXT,
  contact_garage TEXT,
  telephone_garage TEXT,
  montant_ht NUMERIC(10,2),
  montant_tva NUMERIC(10,2),
  montant_ttc NUMERIC(10,2) NOT NULL,
  facturee BOOLEAN DEFAULT false,
  reference_facture TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage interventions"
ON public.interventions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view interventions"
ON public.interventions FOR SELECT
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_interventions_updated_at
BEFORE UPDATE ON public.interventions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to sync vidange with vehicle
CREATE OR REPLACE FUNCTION public.sync_vidange_to_vehicle()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If intervention type is Vidange, update vehicle
  IF NEW.type_intervention = 'Vidange' THEN
    UPDATE vehicles
    SET 
      dernier_kilometrage_vidange = NEW.kilometrage_actuel,
      date_derniere_vidange = NEW.date_intervention,
      updated_at = now()
    WHERE id = NEW.vehicle_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to sync vidange
CREATE TRIGGER sync_vidange_on_insert
AFTER INSERT ON public.interventions
FOR EACH ROW
EXECUTE FUNCTION public.sync_vidange_to_vehicle();

CREATE TRIGGER sync_vidange_on_update
AFTER UPDATE ON public.interventions
FOR EACH ROW
WHEN (OLD.type_intervention IS DISTINCT FROM NEW.type_intervention 
      OR OLD.kilometrage_actuel IS DISTINCT FROM NEW.kilometrage_actuel
      OR OLD.date_intervention IS DISTINCT FROM NEW.date_intervention)
EXECUTE FUNCTION public.sync_vidange_to_vehicle();

-- Function to create expense automatically
CREATE OR REPLACE FUNCTION public.create_expense_for_intervention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Trigger to create expense
CREATE TRIGGER create_expense_on_intervention_insert
BEFORE INSERT ON public.interventions
FOR EACH ROW
WHEN (NEW.depense_id IS NULL)
EXECUTE FUNCTION public.create_expense_for_intervention();

-- Index for performance
CREATE INDEX idx_interventions_vehicle_id ON public.interventions(vehicle_id);
CREATE INDEX idx_interventions_date ON public.interventions(date_intervention DESC);
CREATE INDEX idx_interventions_type ON public.interventions(type_intervention);