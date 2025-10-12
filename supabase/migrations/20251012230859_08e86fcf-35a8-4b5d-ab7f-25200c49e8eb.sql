-- Create vehicules_traite table
CREATE TABLE public.vehicules_traite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  organisme TEXT NOT NULL,
  montant_total NUMERIC NOT NULL,
  montant_mensuel NUMERIC NOT NULL,
  date_debut DATE NOT NULL,
  nombre_traites INTEGER NOT NULL,
  mode_paiement TEXT,
  statut TEXT NOT NULL DEFAULT 'En cours',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicules_traites_echeances table
CREATE TABLE public.vehicules_traites_echeances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  traite_id UUID NOT NULL REFERENCES public.vehicules_traite(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date_echeance DATE NOT NULL,
  montant NUMERIC NOT NULL,
  statut TEXT NOT NULL DEFAULT 'À payer',
  date_paiement DATE,
  mode_paiement TEXT,
  ref_paiement TEXT,
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicules_traite ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicules_traites_echeances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vehicules_traite
CREATE POLICY "Authenticated users can view traites"
  ON public.vehicules_traite FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage traites"
  ON public.vehicules_traite FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- RLS Policies for vehicules_traites_echeances
CREATE POLICY "Authenticated users can view echeances"
  ON public.vehicules_traites_echeances FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage echeances"
  ON public.vehicules_traites_echeances FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Function to generate echeances automatically
CREATE OR REPLACE FUNCTION public.generate_traite_echeances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INTEGER;
  echeance_date DATE;
BEGIN
  -- Generate monthly echeances
  FOR i IN 1..NEW.nombre_traites LOOP
    echeance_date := NEW.date_debut + (i - 1) * INTERVAL '1 month';
    
    INSERT INTO public.vehicules_traites_echeances (
      traite_id,
      vehicle_id,
      date_echeance,
      montant,
      statut
    ) VALUES (
      NEW.id,
      NEW.vehicle_id,
      echeance_date,
      NEW.montant_mensuel,
      'À payer'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate echeances on traite creation
CREATE TRIGGER trigger_generate_echeances
  AFTER INSERT ON public.vehicules_traite
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_traite_echeances();

-- Function to update traite status based on echeances
CREATE OR REPLACE FUNCTION public.update_traite_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_echeances INTEGER;
  payees_echeances INTEGER;
  retard_echeances INTEGER;
BEGIN
  -- Count total and paid echeances
  SELECT COUNT(*), 
         SUM(CASE WHEN statut = 'Payée' THEN 1 ELSE 0 END),
         SUM(CASE WHEN statut = 'En retard' THEN 1 ELSE 0 END)
  INTO total_echeances, payees_echeances, retard_echeances
  FROM public.vehicules_traites_echeances
  WHERE traite_id = NEW.traite_id;
  
  -- Update traite status
  UPDATE public.vehicules_traite
  SET statut = CASE
    WHEN payees_echeances = total_echeances THEN 'Terminé'
    WHEN retard_echeances > 0 THEN 'En retard'
    ELSE 'En cours'
  END,
  updated_at = now()
  WHERE id = NEW.traite_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to update traite status when echeance is updated
CREATE TRIGGER trigger_update_traite_status
  AFTER UPDATE ON public.vehicules_traites_echeances
  FOR EACH ROW
  WHEN (OLD.statut IS DISTINCT FROM NEW.statut)
  EXECUTE FUNCTION public.update_traite_status();

-- Add updated_at triggers
CREATE TRIGGER update_vehicules_traite_updated_at
  BEFORE UPDATE ON public.vehicules_traite
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicules_traites_echeances_updated_at
  BEFORE UPDATE ON public.vehicules_traites_echeances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_vehicules_traite_vehicle_id ON public.vehicules_traite(vehicle_id);
CREATE INDEX idx_vehicules_traites_echeances_traite_id ON public.vehicules_traites_echeances(traite_id);
CREATE INDEX idx_vehicules_traites_echeances_vehicle_id ON public.vehicules_traites_echeances(vehicle_id);
CREATE INDEX idx_vehicules_traites_echeances_date ON public.vehicules_traites_echeances(date_echeance);