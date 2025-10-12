-- Add missing fields to vehicules_traite table
ALTER TABLE public.vehicules_traite 
ADD COLUMN IF NOT EXISTS avance_paye NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS concessionaire TEXT,
ADD COLUMN IF NOT EXISTS date_achat DATE;