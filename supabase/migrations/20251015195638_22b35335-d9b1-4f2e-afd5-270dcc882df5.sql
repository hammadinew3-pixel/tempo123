-- Add missing columns to assurances table
ALTER TABLE public.assurances 
ADD COLUMN IF NOT EXISTS contact_nom TEXT,
ADD COLUMN IF NOT EXISTS contact_telephone TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS adresse TEXT,
ADD COLUMN IF NOT EXISTS delai_paiement_jours INTEGER,
ADD COLUMN IF NOT EXISTS conditions_paiement TEXT;

-- Add missing columns to assurance_bareme table
ALTER TABLE public.assurance_bareme 
ADD COLUMN IF NOT EXISTS categorie TEXT,
ADD COLUMN IF NOT EXISTS tarif_journalier NUMERIC;

-- Add missing columns to vehicules_traites_echeances table
ALTER TABLE public.vehicules_traites_echeances 
ADD COLUMN IF NOT EXISTS date_echeance DATE,
ADD COLUMN IF NOT EXISTS montant NUMERIC,
ADD COLUMN IF NOT EXISTS date_paiement DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create vehicle_assistance_categories table for Parametres page
CREATE TABLE IF NOT EXISTS public.vehicle_assistance_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_assistance_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view categories" 
ON public.vehicle_assistance_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.vehicle_assistance_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));