-- Add categories column to vehicles table to store assistance category codes
ALTER TABLE public.vehicles 
ADD COLUMN categories text[] DEFAULT '{}';

COMMENT ON COLUMN public.vehicles.categories IS 'Array of assistance category codes (references vehicle_assistance_categories.code)';