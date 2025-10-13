-- Add ordre_mission_url field to assistance table for file upload
ALTER TABLE public.assistance 
ADD COLUMN ordre_mission_url TEXT;