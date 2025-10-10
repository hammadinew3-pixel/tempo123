-- Create agence_settings table for admin configuration
CREATE TABLE IF NOT EXISTS public.agence_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Agency legal information
  raison_sociale text,
  ice text,
  if_number text,
  rc text,
  cnss text,
  patente text,
  adresse text,
  email text,
  telephone text,
  logo_url text,
  
  -- Grace periods (in minutes)
  grace_short integer DEFAULT 60, -- 1 hour for 1-3 days rentals
  grace_medium integer DEFAULT 120, -- 2 hours for 4-7 days
  grace_long integer DEFAULT 180, -- 3 hours for +7 days
  
  -- Alerts and tax settings
  taux_tva numeric DEFAULT 20,
  alerte_cheque_jours integer DEFAULT 30,
  alerte_vidange_kms integer DEFAULT 5000,
  alerte_visite_jours integer DEFAULT 30,
  alerte_assurance_jours integer DEFAULT 30,
  alerte_autorisation_jours integer DEFAULT 30,
  
  -- Printing preferences
  masquer_logo boolean DEFAULT false,
  masquer_entete boolean DEFAULT false,
  masquer_pied_page boolean DEFAULT false,
  inclure_cgv boolean DEFAULT false,
  cgv_url text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agence_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage settings"
ON public.agence_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view settings (for printing contracts/invoices)
CREATE POLICY "Authenticated users can view settings"
ON public.agence_settings
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_agence_settings_updated_at
BEFORE UPDATE ON public.agence_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings row (only one row should exist)
INSERT INTO public.agence_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;