-- Add missing columns to sinistres table
ALTER TABLE public.sinistres 
ADD COLUMN IF NOT EXISTS gravite TEXT,
ADD COLUMN IF NOT EXISTS cout_estime NUMERIC;

-- Add missing columns to assistance table
ALTER TABLE public.assistance 
ADD COLUMN IF NOT EXISTS franchise_statut TEXT,
ADD COLUMN IF NOT EXISTS kilometrage_depart INTEGER,
ADD COLUMN IF NOT EXISTS date_retour_effective DATE,
ADD COLUMN IF NOT EXISTS ordre_mission_url TEXT,
ADD COLUMN IF NOT EXISTS assureur_id UUID,
ADD COLUMN IF NOT EXISTS tarif_journalier NUMERIC;

-- Add missing columns to infractions table
ALTER TABLE public.infractions 
ADD COLUMN IF NOT EXISTS lieu TEXT,
ADD COLUMN IF NOT EXISTS type_infraction TEXT,
ADD COLUMN IF NOT EXISTS statut_traitement TEXT;

-- Create infraction_files table
CREATE TABLE IF NOT EXISTS public.infraction_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  infraction_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on infraction_files
ALTER TABLE public.infraction_files ENABLE ROW LEVEL SECURITY;

-- Create policies for infraction_files
CREATE POLICY "Authenticated users can view infraction files" 
ON public.infraction_files 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage infraction files" 
ON public.infraction_files 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to generate infraction reference
CREATE OR REPLACE FUNCTION public.generate_infraction_reference()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(description FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM infractions
  WHERE description LIKE 'INF-' || year_suffix || '-%';
  
  RETURN 'INF-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;