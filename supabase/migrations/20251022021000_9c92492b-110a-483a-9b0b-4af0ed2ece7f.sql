-- La table audit_logs doit aussi gérer la suppression en cascade
-- ou permettre des valeurs NULL pour tenant_id lors de la suppression

-- Option 1 : Rendre tenant_id nullable et mettre SET NULL au lieu de CASCADE
ALTER TABLE public.audit_logs 
  ALTER COLUMN tenant_id DROP NOT NULL;

ALTER TABLE public.audit_logs 
  DROP CONSTRAINT IF EXISTS audit_logs_tenant_id_fkey,
  ADD CONSTRAINT audit_logs_tenant_id_fkey 
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;