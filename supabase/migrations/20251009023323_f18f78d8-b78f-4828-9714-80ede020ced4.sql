-- Create table for insurance companies
CREATE TABLE public.assurances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  contact_nom text,
  contact_email text,
  contact_telephone text,
  adresse text,
  conditions_paiement text,
  delai_paiement_jours integer DEFAULT 30,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;

-- Policies for assurances
CREATE POLICY "Authenticated users can view assurances"
ON public.assurances
FOR SELECT
USING (true);

CREATE POLICY "Admins and agents can manage assurances"
ON public.assurances
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_assurances_updated_at
BEFORE UPDATE ON public.assurances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update assistance table to link to assurances table
ALTER TABLE public.assistance 
ADD COLUMN assureur_id uuid REFERENCES public.assurances(id);

-- Add index for better performance
CREATE INDEX idx_assistance_assureur_id ON public.assistance(assureur_id);
CREATE INDEX idx_assistance_date_debut ON public.assistance(date_debut);
CREATE INDEX idx_assistance_etat ON public.assistance(etat);

-- Add policies for assistance table CRUD operations
CREATE POLICY "Admins and agents can insert assistance"
ON public.assistance
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins and agents can update assistance"
ON public.assistance
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins can delete assistance"
ON public.assistance
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));