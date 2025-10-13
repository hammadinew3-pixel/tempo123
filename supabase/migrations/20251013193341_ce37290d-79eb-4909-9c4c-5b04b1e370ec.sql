-- Add ordre_mission field to assistance table
ALTER TABLE public.assistance 
ADD COLUMN ordre_mission TEXT;

-- Temporarily disable the validation trigger for vehicles
ALTER TABLE public.vehicles DISABLE TRIGGER validate_agent_vehicle_update_trigger;

-- Add a new column for multiple categories
ALTER TABLE public.vehicles 
ADD COLUMN categories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing single category to the new array column
UPDATE public.vehicles 
SET categories = ARRAY[categorie::TEXT]
WHERE categorie IS NOT NULL;

-- Set default empty array for NULL categories
UPDATE public.vehicles 
SET categories = ARRAY[]::TEXT[]
WHERE categorie IS NULL;

-- Re-enable the validation trigger
ALTER TABLE public.vehicles ENABLE TRIGGER validate_agent_vehicle_update_trigger;