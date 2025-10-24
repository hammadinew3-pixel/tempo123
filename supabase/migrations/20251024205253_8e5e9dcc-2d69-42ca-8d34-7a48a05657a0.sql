-- Create vehicle_carte_grise table
CREATE TABLE public.vehicle_carte_grise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_carte_grise ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their tenant carte grise"
  ON public.vehicle_carte_grise
  FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND tenant_is_active(auth.uid()) = true);

CREATE POLICY "Agents can insert carte grise in their tenant"
  ON public.vehicle_carte_grise
  FOR INSERT
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND tenant_is_active(auth.uid()) = true
    AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Agents can update carte grise in their tenant"
  ON public.vehicle_carte_grise
  FOR UPDATE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND tenant_is_active(auth.uid()) = true
    AND (has_role(auth.uid(), 'agent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Admins can delete carte grise in their tenant"
  ON public.vehicle_carte_grise
  FOR DELETE
  USING (
    tenant_id = get_user_tenant_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Create indexes
CREATE INDEX idx_vehicle_carte_grise_vehicle_id ON public.vehicle_carte_grise(vehicle_id);
CREATE INDEX idx_vehicle_carte_grise_tenant_id ON public.vehicle_carte_grise(tenant_id);

-- Trigger for updated_at
CREATE TRIGGER update_vehicle_carte_grise_updated_at
  BEFORE UPDATE ON public.vehicle_carte_grise
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tenant_id auto-assignment
CREATE TRIGGER set_tenant_id_on_vehicle_carte_grise
  BEFORE INSERT OR UPDATE ON public.vehicle_carte_grise
  FOR EACH ROW
  EXECUTE FUNCTION set_tenant_id_default();

-- Audit log trigger
CREATE TRIGGER audit_vehicle_carte_grise
  AFTER INSERT OR UPDATE OR DELETE ON public.vehicle_carte_grise
  FOR EACH ROW
  EXECUTE FUNCTION log_audit_event();

-- Enable realtime
ALTER TABLE public.vehicle_carte_grise REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_carte_grise;