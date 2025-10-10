-- Créer l'enum pour les types d'infractions
CREATE TYPE public.infraction_type AS ENUM (
  'exces_vitesse',
  'stationnement',
  'feu_rouge',
  'telephone',
  'autre'
);

-- Créer l'enum pour les statuts de traitement
CREATE TYPE public.infraction_statut AS ENUM (
  'nouveau',
  'transmis',
  'clos'
);

-- Créer l'enum pour les types de fichiers
CREATE TYPE public.infraction_file_type AS ENUM (
  'pv',
  'photo',
  'recu',
  'autre'
);

-- Table infractions
CREATE TABLE public.infractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  date_infraction DATE NOT NULL,
  lieu TEXT NOT NULL,
  type_infraction infraction_type NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  description TEXT,
  montant NUMERIC(10,2) NOT NULL DEFAULT 0,
  statut_traitement infraction_statut NOT NULL DEFAULT 'nouveau',
  date_transmission DATE,
  commentaire TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table infraction_files
CREATE TABLE public.infraction_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  infraction_id UUID NOT NULL REFERENCES public.infractions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type infraction_file_type NOT NULL DEFAULT 'autre',
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Fonction pour générer la référence automatiquement
CREATE OR REPLACE FUNCTION public.generate_infraction_reference()
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
      SUBSTRING(reference FROM 'INF-' || current_year || '-(.*)') AS INT
    )
  ), 0) + 1
  INTO next_number
  FROM public.infractions
  WHERE reference LIKE 'INF-' || current_year || '-%';
  
  -- Generate new reference
  new_reference := 'INF-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN new_reference;
END;
$$;

-- Index pour améliorer les performances
CREATE INDEX idx_infractions_vehicle_id ON public.infractions(vehicle_id);
CREATE INDEX idx_infractions_contract_id ON public.infractions(contract_id);
CREATE INDEX idx_infractions_client_id ON public.infractions(client_id);
CREATE INDEX idx_infractions_date ON public.infractions(date_infraction);
CREATE INDEX idx_infractions_statut ON public.infractions(statut_traitement);
CREATE INDEX idx_infraction_files_infraction_id ON public.infraction_files(infraction_id);

-- Trigger pour updated_at
CREATE TRIGGER update_infractions_updated_at
BEFORE UPDATE ON public.infractions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger pour l'audit
CREATE TRIGGER log_infractions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.infractions
FOR EACH ROW
EXECUTE FUNCTION public.log_table_changes();

-- Enable Row Level Security
ALTER TABLE public.infractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infraction_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour infractions
CREATE POLICY "Authenticated users can view infractions"
ON public.infractions
FOR SELECT
USING (true);

CREATE POLICY "Admins and agents can insert infractions"
ON public.infractions
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins and agents can update infractions"
ON public.infractions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins can delete infractions"
ON public.infractions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies pour infraction_files
CREATE POLICY "Authenticated users can view infraction files"
ON public.infraction_files
FOR SELECT
USING (true);

CREATE POLICY "Admins and agents can insert infraction files"
ON public.infraction_files
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

CREATE POLICY "Admins and agents can delete infraction files"
ON public.infraction_files
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Ajouter infractions à la publication realtime
ALTER TABLE public.infractions REPLICA IDENTITY FULL;
ALTER TABLE public.infraction_files REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.infractions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.infraction_files;