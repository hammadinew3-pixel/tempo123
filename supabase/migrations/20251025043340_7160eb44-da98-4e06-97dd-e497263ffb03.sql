-- Add inspection diagram URL to tenant settings
ALTER TABLE public.tenant_settings
ADD COLUMN inspection_diagram_url text NULL;