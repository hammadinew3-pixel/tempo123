-- Fix FK to allow tenant deletion by cascading tenant_settings
ALTER TABLE public.tenant_settings
  DROP CONSTRAINT IF EXISTS tenant_settings_tenant_id_fkey;
ALTER TABLE public.tenant_settings
  ADD CONSTRAINT tenant_settings_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants(id)
  ON DELETE CASCADE;