-- Add missing column to vidanges table
ALTER TABLE public.vidanges
ADD COLUMN IF NOT EXISTS remarques text;

COMMENT ON COLUMN public.vidanges.remarques IS 'Remarques additionnelles sur la vidange';