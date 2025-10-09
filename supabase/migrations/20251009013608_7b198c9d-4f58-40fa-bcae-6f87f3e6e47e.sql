-- Create table for vehicle insurance
CREATE TABLE public.vehicle_insurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  numero_ordre TEXT NOT NULL,
  numero_police TEXT,
  assureur TEXT NOT NULL,
  coordonnees_assureur TEXT,
  date_debut DATE NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC NOT NULL,
  date_paiement DATE NOT NULL,
  mode_paiement payment_method NOT NULL,
  numero_cheque TEXT,
  banque TEXT,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_insurance ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view insurance"
  ON public.vehicle_insurance
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage insurance"
  ON public.vehicle_insurance
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Create table for vehicle technical inspection (visite technique)
CREATE TABLE public.vehicle_technical_inspection (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  numero_ordre TEXT NOT NULL,
  date_visite DATE NOT NULL,
  date_expiration DATE NOT NULL,
  centre_controle TEXT,
  montant NUMERIC,
  date_paiement DATE,
  mode_paiement payment_method,
  numero_cheque TEXT,
  banque TEXT,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_technical_inspection ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view technical inspections"
  ON public.vehicle_technical_inspection
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage technical inspections"
  ON public.vehicle_technical_inspection
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Create table for vehicle vignette/authorization
CREATE TABLE public.vehicle_vignette (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  numero_ordre TEXT NOT NULL,
  annee INTEGER NOT NULL,
  date_expiration DATE NOT NULL,
  montant NUMERIC,
  date_paiement DATE,
  mode_paiement payment_method,
  numero_cheque TEXT,
  banque TEXT,
  remarques TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_vignette ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view vignettes"
  ON public.vehicle_vignette
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage vignettes"
  ON public.vehicle_vignette
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_insurance_updated_at
  BEFORE UPDATE ON public.vehicle_insurance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_technical_inspection_updated_at
  BEFORE UPDATE ON public.vehicle_technical_inspection
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicle_vignette_updated_at
  BEFORE UPDATE ON public.vehicle_vignette
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();