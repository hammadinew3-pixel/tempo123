-- Create vehicle_assistance_categories table
CREATE TABLE IF NOT EXISTS public.vehicle_assistance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_assistance_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view categories"
  ON public.vehicle_assistance_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.vehicle_assistance_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.vehicle_assistance_categories (code, label, description, ordre) VALUES
  ('A', 'Citadine', 'Véhicules citadins compacts', 1),
  ('B', 'Economique', 'Véhicules économiques', 2),
  ('C', 'Compacte', 'Véhicules compacts polyvalents', 3),
  ('D', 'Berline', 'Berlines spacieuses', 4),
  ('E', 'SUV/Luxe', 'SUV et véhicules de luxe', 5);

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_assistance_categories_updated_at
  BEFORE UPDATE ON public.vehicle_assistance_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();