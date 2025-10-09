-- Create enum for vehicle categories
CREATE TYPE public.vehicle_category AS ENUM ('A', 'B', 'C', 'D', 'E');

-- Add category column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN categorie vehicle_category;

-- Create table for insurance pricing per category
CREATE TABLE public.assurance_bareme (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assurance_id uuid NOT NULL REFERENCES public.assurances(id) ON DELETE CASCADE,
  categorie vehicle_category NOT NULL,
  tarif_journalier numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(assurance_id, categorie)
);

-- Enable RLS
ALTER TABLE public.assurance_bareme ENABLE ROW LEVEL SECURITY;

-- Policies for assurance_bareme
CREATE POLICY "Authenticated users can view bareme"
ON public.assurance_bareme
FOR SELECT
USING (true);

CREATE POLICY "Admins and agents can manage bareme"
ON public.assurance_bareme
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_assurance_bareme_updated_at
BEFORE UPDATE ON public.assurance_bareme
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add reservation fields to assistance table
ALTER TABLE public.assistance
ADD COLUMN tarif_journalier numeric,
ADD COLUMN montant_total numeric,
ADD COLUMN kilometrage_depart integer,
ADD COLUMN kilometrage_retour integer,
ADD COLUMN niveau_carburant_depart text,
ADD COLUMN niveau_carburant_retour text,
ADD COLUMN etat_vehicule_depart text,
ADD COLUMN etat_vehicule_retour text,
ADD COLUMN date_retour_effective date,
ADD COLUMN remarques text;

-- Create index for better performance
CREATE INDEX idx_assurance_bareme_assurance_id ON public.assurance_bareme(assurance_id);
CREATE INDEX idx_vehicles_categorie ON public.vehicles(categorie);