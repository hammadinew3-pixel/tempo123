-- Ajouter le champ dernier_kilometrage_vidange à la table vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS dernier_kilometrage_vidange integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS date_derniere_vidange date;

-- Créer une table pour l'historique des vidanges
CREATE TABLE IF NOT EXISTS public.vidanges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  kilometrage integer NOT NULL,
  date_vidange date NOT NULL DEFAULT CURRENT_DATE,
  type text,
  montant numeric,
  remarques text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vidanges ENABLE ROW LEVEL SECURITY;

-- RLS policies pour vidanges
CREATE POLICY "Authenticated users can view vidanges" 
ON public.vidanges 
FOR SELECT 
USING (true);

CREATE POLICY "Admins and agents can manage vidanges" 
ON public.vidanges 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'agent'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_vidanges_updated_at
  BEFORE UPDATE ON public.vidanges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();