-- Create enums for sinistres
CREATE TYPE public.sinistre_type AS ENUM ('accident', 'vol', 'panne_grave', 'autre');
CREATE TYPE public.sinistre_responsabilite AS ENUM ('locataire', 'tiers', 'indeterminee');
CREATE TYPE public.sinistre_gravite AS ENUM ('legere', 'moyenne', 'grave');
CREATE TYPE public.sinistre_statut AS ENUM ('ouvert', 'en_cours', 'clos');
CREATE TYPE public.sinistre_file_type AS ENUM ('photo', 'constat', 'facture', 'autre');

-- Create sinistres table
CREATE TABLE public.sinistres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  type_sinistre sinistre_type NOT NULL,
  date_sinistre DATE NOT NULL,
  lieu TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  responsabilite sinistre_responsabilite NOT NULL,
  gravite sinistre_gravite NOT NULL,
  description TEXT,
  cout_estime NUMERIC,
  statut sinistre_statut NOT NULL DEFAULT 'ouvert',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create sinistre_files table
CREATE TABLE public.sinistre_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sinistre_id UUID NOT NULL REFERENCES public.sinistres(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type sinistre_file_type NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sinistres_vehicle ON public.sinistres(vehicle_id);
CREATE INDEX idx_sinistres_contract ON public.sinistres(contract_id);
CREATE INDEX idx_sinistres_client ON public.sinistres(client_id);
CREATE INDEX idx_sinistres_statut ON public.sinistres(statut);
CREATE INDEX idx_sinistres_date ON public.sinistres(date_sinistre DESC);
CREATE INDEX idx_sinistre_files_sinistre ON public.sinistre_files(sinistre_id);

-- Enable RLS
ALTER TABLE public.sinistres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinistre_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sinistres
CREATE POLICY "Authenticated users can view sinistres"
  ON public.sinistres FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can insert sinistres"
  ON public.sinistres FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins and agents can update sinistres"
  ON public.sinistres FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins can delete sinistres"
  ON public.sinistres FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for sinistre_files
CREATE POLICY "Authenticated users can view files"
  ON public.sinistre_files FOR SELECT
  USING (true);

CREATE POLICY "Admins and agents can manage files"
  ON public.sinistre_files FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_sinistres_updated_at
  BEFORE UPDATE ON public.sinistres
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for audit logs
CREATE TRIGGER audit_sinistres
  AFTER INSERT OR UPDATE OR DELETE ON public.sinistres
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

CREATE TRIGGER audit_sinistre_files
  AFTER INSERT OR UPDATE OR DELETE ON public.sinistre_files
  FOR EACH ROW EXECUTE FUNCTION log_table_changes();

-- Function to generate reference
CREATE OR REPLACE FUNCTION public.generate_sinistre_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  next_number INT;
  new_reference TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Get the last number for this year
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(reference FROM 'SIN-' || current_year || '-(.*)') AS INT
    )
  ), 0) + 1
  INTO next_number
  FROM public.sinistres
  WHERE reference LIKE 'SIN-' || current_year || '-%';
  
  -- Generate new reference
  new_reference := 'SIN-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_reference;
END;
$$;