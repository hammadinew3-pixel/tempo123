-- Create sinistre_files table
CREATE TABLE IF NOT EXISTS public.sinistre_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sinistre_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sinistre_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sinistre files" 
ON public.sinistre_files FOR SELECT USING (true);

CREATE POLICY "Admins can manage sinistre files" 
ON public.sinistre_files FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create vidanges table
CREATE TABLE IF NOT EXISTS public.vidanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  date_vidange DATE NOT NULL,
  kilometrage INTEGER NOT NULL,
  montant NUMERIC,
  type_vidange TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vidanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vidanges" 
ON public.vidanges FOR SELECT USING (true);

CREATE POLICY "Admins can manage vidanges" 
ON public.vidanges FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create vehicules_traite table
CREATE TABLE IF NOT EXISTS public.vehicules_traite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  type_traitement TEXT NOT NULL,
  date_traitement DATE NOT NULL,
  montant NUMERIC,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.vehicules_traite ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vehicules_traite" 
ON public.vehicules_traite FOR SELECT USING (true);

CREATE POLICY "Admins can manage vehicules_traite" 
ON public.vehicules_traite FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add missing columns
ALTER TABLE public.assistance ADD COLUMN IF NOT EXISTS ordre_mission TEXT;
ALTER TABLE public.vehicle_changes ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS assurance_expire_le DATE;

-- Create function to generate sinistre reference
CREATE OR REPLACE FUNCTION public.generate_sinistre_reference()
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
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(reference FROM '\d+') AS INTEGER)), 0) + 1
  INTO next_number
  FROM sinistres
  WHERE reference LIKE 'SIN-' || year_suffix || '-%';
  
  RETURN 'SIN-' || year_suffix || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;