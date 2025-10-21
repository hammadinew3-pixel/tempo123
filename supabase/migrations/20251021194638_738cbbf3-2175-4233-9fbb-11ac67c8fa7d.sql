-- Add photo_url column to store vignette document URL
ALTER TABLE public.vehicle_vignette
ADD COLUMN IF NOT EXISTS photo_url text;

-- Optional: comment for documentation
COMMENT ON COLUMN public.vehicle_vignette.photo_url IS 'URL du document (image ou PDF) stocké dans Supabase Storage pour la vignette du véhicule';